import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BidStatus, JobStatus, TripStatus, VerificationStatus } from '@athenagrid/shared';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { RealtimeService } from '../tracking/realtime.service';
import { PricingService } from '../pricing/pricing.service';
import { AwardDto, PlaceBidDto } from './dto';

@Injectable()
export class BidsService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
    private realtime: RealtimeService,
    private pricing: PricingService,
  ) {}

  async listForJob(jobId: string, requesterUserId: string, requesterRole: string) {
    // Shipper sees all bids on their job; a carrier sees only their own.
    if (requesterRole === 'CARRIER') {
      const carrierId = await this.users.carrierProfileId(requesterUserId);
      return this.prisma.bid.findMany({ where: { jobId, carrierId }, orderBy: { amount: 'asc' } });
    }

    const job = await this.prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    const bids = await this.prisma.bid.findMany({
      where: { jobId },
      orderBy: { amount: 'asc' },
      include: { carrier: { select: { companyName: true, verificationStatus: true, type: true } } },
    });

    // Score bids against the fair band and preview the farmer bill / driver payout.
    const band = {
      reference: job.referencePrice ?? 0,
      floor: job.floorPrice ?? 0,
      ceiling: job.ceilingPrice ?? Number.MAX_SAFE_INTEGER,
    };
    return this.pricing.rankBids(bids, band).map((b) => ({
      ...b,
      settlementPreview: this.pricing.settle(b.amount),
    }));
  }

  /**
   * Place a bid. Concurrency-safe: re-reads the job inside a transaction with a row
   * lock so the auction can't be won or closed underneath us, and enforces the
   * verification gate + bidding window at the boundary.
   */
  async placeBid(userId: string, jobId: string, dto: PlaceBidDto) {
    const carrierId = await this.users.carrierProfileId(userId);

    // Verification gate — unverified carriers are rejected before touching the auction.
    const carrier = await this.prisma.carrierProfile.findUniqueOrThrow({ where: { id: carrierId } });
    if (carrier.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException('Carrier must be VERIFIED before bidding');
    }

    // Vehicle must belong to this carrier.
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle || vehicle.carrierId !== carrierId) {
      throw new BadRequestException('Vehicle not found for this carrier');
    }

    const bid = await this.prisma.$transaction(async (tx) => {
      // Lock the job row for the duration of the auction check.
      const [job] = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, status, "biddingClosesAt", "coldChainRequired", "weightKg"
           FROM "Job" WHERE id = $1 FOR UPDATE`,
        jobId,
      );
      if (!job) throw new NotFoundException('Job not found');
      if (job.status !== JobStatus.OPEN) throw new BadRequestException('Job is not open for bids');
      if (new Date(job.biddingClosesAt) <= new Date()) {
        throw new BadRequestException('Bidding window has closed');
      }
      if (job.coldChainRequired && !vehicle.refrigerated) {
        throw new BadRequestException('This job requires a refrigerated vehicle');
      }
      if (vehicle.capacityKg < Number(job.weightKg)) {
        throw new BadRequestException('Vehicle capacity is below the cargo weight');
      }

      // Upsert enforces one active bid per carrier per job (unique jobId+carrierId).
      return tx.bid.upsert({
        where: { jobId_carrierId: { jobId, carrierId } },
        update: {
          amount: dto.amount,
          etaMinutes: dto.etaMinutes,
          vehicleId: dto.vehicleId,
          message: dto.message,
          status: BidStatus.ACTIVE,
        },
        create: {
          jobId,
          carrierId,
          vehicleId: dto.vehicleId,
          amount: dto.amount,
          etaMinutes: dto.etaMinutes,
          message: dto.message,
        },
      });
    });

    // Broadcast to everyone watching the job's live bid feed.
    this.realtime.emitToJob(jobId, {
      type: 'bid:new',
      jobId,
      bidId: bid.id,
      amount: bid.amount,
      etaMinutes: bid.etaMinutes,
      carrierId,
    });
    return bid;
  }

  async withdraw(userId: string, bidId: string) {
    const carrierId = await this.users.carrierProfileId(userId);
    const bid = await this.prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid || bid.carrierId !== carrierId) throw new NotFoundException('Bid not found');
    if (bid.status !== BidStatus.ACTIVE) throw new BadRequestException('Only active bids can be withdrawn');
    return this.prisma.bid.update({ where: { id: bidId }, data: { status: BidStatus.WITHDRAWN } });
  }

  /**
   * Award a bid. One transaction: assert the shipper owns an OPEN job, mark the
   * winning bid WON, reject all others, create the Trip, and flip the job to AWARDED.
   * The unique constraint on Job.awardedBidId guarantees a job can be awarded once.
   */
  async award(shipperUserId: string, jobId: string, dto: AwardDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const [job] = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, "shipperId", status FROM "Job" WHERE id = $1 FOR UPDATE`,
        jobId,
      );
      if (!job) throw new NotFoundException('Job not found');
      if (job.shipperId !== shipperUserId) throw new ForbiddenException('Not your job');
      if (job.status !== JobStatus.OPEN && job.status !== JobStatus.CLOSED) {
        throw new BadRequestException('Job is not awardable');
      }

      const bid = await tx.bid.findUnique({ where: { id: dto.bidId } });
      if (!bid || bid.jobId !== jobId) throw new NotFoundException('Bid not found on this job');
      if (bid.status !== BidStatus.ACTIVE) throw new BadRequestException('Bid is not active');

      await tx.bid.update({ where: { id: bid.id }, data: { status: BidStatus.WON } });
      await tx.bid.updateMany({
        where: { jobId, id: { not: bid.id }, status: BidStatus.ACTIVE },
        data: { status: BidStatus.REJECTED },
      });

      await tx.job.update({
        where: { id: jobId },
        data: { status: JobStatus.AWARDED, awardedBidId: bid.id },
      });

      // Assign a driver: use the one supplied, else the carrier's first driver
      // so the awarded trip is immediately trackable/executable.
      let driverId = dto.driverId;
      if (!driverId) {
        const driver = await tx.driverProfile.findFirst({ where: { carrierId: bid.carrierId } });
        driverId = driver?.id;
      }

      const trip = await tx.trip.create({
        data: {
          jobId,
          vehicleId: bid.vehicleId,
          driverId,
          status: TripStatus.ASSIGNED,
        },
      });

      // Money split: farmer bill + driver payout + platform take, stored on the job.
      const s = this.pricing.settle(bid.amount);
      const settlement = await tx.settlement.create({
        data: {
          jobId,
          transportPrice: s.transportPrice,
          carrierCommissionRate: s.carrierCommissionRate,
          shipperFeeRate: s.shipperFeeRate,
          carrierCommission: s.carrierCommission,
          shipperFee: s.shipperFee,
          farmerTotal: s.farmerTotal,
          driverPayout: s.driverPayout,
          platformRevenue: s.platformRevenue,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: shipperUserId,
          action: 'job.award',
          entity: 'Job',
          entityId: jobId,
          metadata: { bidId: bid.id, carrierId: bid.carrierId, amount: bid.amount },
        },
      });

      return { bid, trip, settlement };
    });

    this.realtime.emitToJob(jobId, {
      type: 'bid:awarded',
      jobId,
      bidId: result.bid.id,
      carrierId: result.bid.carrierId,
    });
    return {
      tripId: result.trip.id,
      awardedBidId: result.bid.id,
      settlement: result.settlement,
    };
  }
}
