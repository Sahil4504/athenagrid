import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_MARKETPLACE_FEE_RATE, JobStatus, ShipperType } from '@athenagrid/shared';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateOrderDto } from './dto';

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class MarketplaceService {
  constructor(
    private prisma: PrismaService,
    private geo: GeoService,
    private pricing: PricingService,
    private config: ConfigService,
  ) {}

  private get feeRate(): number {
    return Number(this.config.get('MARKETPLACE_FEE_RATE', DEFAULT_MARKETPLACE_FEE_RATE));
  }

  /** The farmer placing marketplace actions — must be a FARMER shipper with a location. */
  private async requireFarmer(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'SHIPPER' || user.shipperType !== ShipperType.FARMER) {
      throw new ForbiddenException('Only farmers can use the industry marketplace');
    }
    return user;
  }

  /** Nearby industries (nearest first) with their catalog. */
  async nearbyIndustries(userId: string) {
    const farmer = await this.requireFarmer(userId);
    const industries = await this.prisma.industry.findMany({ include: { catalog: true } });

    const hasLoc = farmer.lat != null && farmer.lng != null;
    return industries
      .map((ind) => ({
        ...ind,
        distanceKm: hasLoc ? round2(this.geo.distanceKm(farmer.lat!, farmer.lng!, ind.lat, ind.lng)) : null,
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  /** Create an order and auto-post a transport job (industry → farmer). */
  async createOrder(userId: string, dto: CreateOrderDto) {
    const farmer = await this.requireFarmer(userId);
    if (farmer.lat == null || farmer.lng == null) {
      throw new BadRequestException('Add your delivery address before ordering');
    }
    const industry = await this.prisma.industry.findUnique({ where: { id: dto.industryId } });
    if (!industry) throw new NotFoundException('Industry not found');

    const catalog = await this.prisma.catalogItem.findMany({
      where: { id: { in: dto.items.map((i) => i.catalogItemId) }, industryId: industry.id },
    });
    if (catalog.length !== dto.items.length) {
      throw new BadRequestException('Some items are not sold by this industry');
    }

    const lines = dto.items.map((i) => {
      const item = catalog.find((c) => c.id === i.catalogItemId)!;
      return {
        catalogItemId: item.id,
        name: item.name,
        qty: i.qty,
        unitPrice: item.pricePerUnit,
        lineTotal: round2(item.pricePerUnit * i.qty),
        weightKg: item.weightKgPerUnit * i.qty,
      };
    });

    const itemsTotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
    const marketplaceFee = round2(itemsTotal * this.feeRate);
    const weightKg = Math.max(1, round2(lines.reduce((s, l) => s + l.weightKg, 0)));
    const summary = catalog.map((c) => c.name).slice(0, 3).join(', ');

    const band = this.pricing.computeBand({
      pickupLat: industry.lat,
      pickupLng: industry.lng,
      dropoffLat: farmer.lat,
      dropoffLng: farmer.lng,
      weightKg,
      coldChainRequired: false,
      perishabilityIndex: 0,
    });

    const now = Date.now();
    const order = await this.prisma.$transaction(async (tx) => {
      // Auto-posted transport job: pickup at the industry, dropoff at the farmer.
      const job = await tx.job.create({
        data: {
          shipperId: farmer.id,
          status: JobStatus.OPEN,
          pickupLat: industry.lat,
          pickupLng: industry.lng,
          pickupAddress: `${industry.name}, ${industry.city}`,
          dropoffLat: farmer.lat!,
          dropoffLng: farmer.lng!,
          dropoffAddress: farmer.address ?? 'Farmer address',
          cropType: `Farm supplies (${summary})`,
          weightKg,
          volumeM3: Math.max(1, round2(weightKg / 200)),
          perishabilityIndex: 0,
          coldChainRequired: false,
          pickupWindowStart: new Date(now + 6 * 3600_000),
          pickupWindowEnd: new Date(now + 24 * 3600_000),
          biddingClosesAt: new Date(now + 6 * 3600_000),
          referencePrice: band.reference,
          floorPrice: band.floor,
          ceilingPrice: band.ceiling,
        },
      });

      return tx.order.create({
        data: {
          farmerId: farmer.id,
          industryId: industry.id,
          itemsTotal,
          marketplaceFee,
          jobId: job.id,
          items: {
            create: lines.map((l) => ({
              catalogItemId: l.catalogItemId,
              name: l.name,
              qty: l.qty,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
            })),
          },
        },
        include: { items: true, industry: true, job: true },
      });
    });

    return order;
  }

  /** Farmer's orders with items + linked transport job (bids/settlement) for the combined bill. */
  async listOrders(userId: string) {
    const farmer = await this.requireFarmer(userId);
    const orders = await this.prisma.order.findMany({
      where: { farmerId: farmer.id },
      include: {
        items: true,
        industry: true,
        job: { include: { settlement: true, bids: true, trip: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach a combined bill (items + fee + transport once awarded).
    return orders.map((o) => {
      const transportFarmer = o.job?.settlement?.farmerTotal ?? 0;
      return {
        ...o,
        bill: {
          itemsTotal: o.itemsTotal,
          marketplaceFee: o.marketplaceFee,
          transportTotal: transportFarmer, // transport price + 4% service fee
          transportAwarded: !!o.job?.settlement,
          grandTotal: round2(o.itemsTotal + o.marketplaceFee + transportFarmer),
        },
      };
    });
  }
}
