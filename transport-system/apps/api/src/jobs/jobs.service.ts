import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JobStatus } from '@athenagrid/shared';
import { PrismaService } from '../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateJobDto, SearchJobsDto } from './dto';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private geo: GeoService,
    private pricing: PricingService,
  ) {}

  async create(shipperId: string, dto: CreateJobDto) {
    if (new Date(dto.biddingClosesAt) <= new Date()) {
      throw new BadRequestException('biddingClosesAt must be in the future');
    }
    // Cold-chain is forced on when the crop is highly perishable, regardless of input.
    const coldChain = dto.cargo.coldChainRequired || dto.cargo.perishabilityIndex > 0.6;

    // Fair-price band, so carriers see a suggested range and bids can be scored.
    const band = this.pricing.computeBand({
      pickupLat: dto.pickup.lat,
      pickupLng: dto.pickup.lng,
      dropoffLat: dto.dropoff.lat,
      dropoffLng: dto.dropoff.lng,
      weightKg: dto.cargo.weightKg,
      coldChainRequired: coldChain,
      perishabilityIndex: dto.cargo.perishabilityIndex,
      budgetCeiling: dto.budgetCeiling,
    });

    return this.prisma.job.create({
      data: {
        shipperId,
        status: JobStatus.OPEN,
        pickupLat: dto.pickup.lat,
        pickupLng: dto.pickup.lng,
        pickupAddress: dto.pickup.address,
        dropoffLat: dto.dropoff.lat,
        dropoffLng: dto.dropoff.lng,
        dropoffAddress: dto.dropoff.address,
        cropType: dto.cargo.cropType,
        weightKg: dto.cargo.weightKg,
        volumeM3: dto.cargo.volumeM3,
        perishabilityIndex: dto.cargo.perishabilityIndex,
        coldChainRequired: coldChain,
        pickupWindowStart: new Date(dto.pickupWindowStart),
        pickupWindowEnd: new Date(dto.pickupWindowEnd),
        biddingClosesAt: new Date(dto.biddingClosesAt),
        budgetCeiling: dto.budgetCeiling,
        referencePrice: band.reference,
        floorPrice: band.floor,
        ceilingPrice: band.ceiling,
      },
    });
  }

  async search(q: SearchJobsDto) {
    // Geo path: index-backed radius search, then hydrate.
    if (q.nearLat != null && q.nearLng != null && q.radiusKm != null) {
      const ids = await this.geo.openJobIdsNear(q.nearLat, q.nearLng, q.radiusKm);
      const jobs = await this.prisma.job.findMany({
        where: { id: { in: ids }, ...(q.coldChainOnly ? { coldChainRequired: true } : {}) },
      });
      // Preserve nearest-first ordering from the geo query.
      const order = new Map(ids.map((id, i) => [id, i]));
      return jobs.sort((a, b) => (order.get(a.id)! - order.get(b.id)!));
    }

    return this.prisma.job.findMany({
      where: {
        ...(q.status ? { status: q.status as JobStatus } : { status: JobStatus.OPEN }),
        ...(q.coldChainOnly ? { coldChainRequired: true } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { bids: { orderBy: { amount: 'asc' } }, trip: true, settlement: true },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async close(shipperId: string, id: string) {
    const job = await this.assertOwner(shipperId, id);
    if (job.status !== JobStatus.OPEN) throw new BadRequestException('Job is not open');
    return this.prisma.job.update({ where: { id }, data: { status: JobStatus.CLOSED } });
  }

  async cancel(shipperId: string, id: string) {
    const job = await this.assertOwner(shipperId, id);
    if ([JobStatus.IN_TRANSIT, JobStatus.DELIVERED].includes(job.status as JobStatus)) {
      throw new BadRequestException('Cannot cancel a job already in transit or delivered');
    }
    return this.prisma.job.update({ where: { id }, data: { status: JobStatus.CANCELLED } });
  }

  private async assertOwner(shipperId: string, id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.shipperId !== shipperId) throw new ForbiddenException('Not your job');
    return job;
  }
}
