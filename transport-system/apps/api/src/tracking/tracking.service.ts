import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, TripStatus, TRIP_TRANSITIONS } from '@athenagrid/shared';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from './realtime.service';

@Injectable()
export class TrackingService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeService,
  ) {}

  async getTrip(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        events: { orderBy: { createdAt: 'desc' }, take: 50 },
        job: { include: { settlement: true } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  /** Trips visible to the caller. */
  async listTrips(userId: string, role: string) {
    const withJob = { job: { include: { settlement: true } } };
    // The winning carrier (Transport Company OR Individual) executes its own deliveries:
    // return every trip whose vehicle belongs to this carrier.
    if (role === 'CARRIER') {
      const carrier = await this.prisma.carrierProfile.findUnique({ where: { userId } });
      if (!carrier) return [];
      return this.prisma.trip.findMany({
        where: { vehicle: { carrierId: carrier.id } },
        include: withJob,
        orderBy: { createdAt: 'desc' },
      });
    }
    if (role === 'DRIVER') {
      const driver = await this.prisma.driverProfile.findUnique({ where: { userId } });
      if (!driver) return [];
      return this.prisma.trip.findMany({
        where: { driverId: driver.id },
        include: withJob,
        orderBy: { createdAt: 'desc' },
      });
    }
    if (role === 'SHIPPER') {
      return this.prisma.trip.findMany({
        where: { job: { shipperId: userId } },
        include: withJob,
        orderBy: { createdAt: 'desc' },
      });
    }
    return [];
  }

  /** Allow the assigned driver OR the carrier that owns the trip (company/individual). */
  private async assertTripActor(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: { select: { userId: true } },
        vehicle: { select: { carrier: { select: { userId: true } } } },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    const isDriver = trip.driver?.userId === userId;
    const isCarrierOwner = trip.vehicle?.carrier?.userId === userId;
    if (!isDriver && !isCarrierOwner) {
      throw new ForbiddenException('You cannot update this trip');
    }
    return trip;
  }

  /** Append a location ping and rebroadcast to the trip room. */
  async recordLocation(driverUserId: string, tripId: string, lat: number, lng: number) {
    await this.assertTripActor(tripId, driverUserId);

    await this.prisma.$transaction([
      this.prisma.tripEvent.create({ data: { tripId, lat, lng } }),
      this.prisma.trip.update({ where: { id: tripId }, data: { currentLat: lat, currentLng: lng } }),
    ]);

    this.realtime.emitToTrip(tripId, {
      type: 'trip:location',
      tripId,
      lat,
      lng,
      at: new Date().toISOString(),
    });
    return { ok: true };
  }

  /** Advance the trip state machine (validated against TRIP_TRANSITIONS). */
  async advanceStatus(requesterUserId: string, tripId: string, next: TripStatus) {
    const trip = await this.assertTripActor(tripId, requesterUserId);

    const allowed = TRIP_TRANSITIONS[trip.status as TripStatus] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(`Illegal transition ${trip.status} → ${next}`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.trip.update({
        where: { id: tripId },
        data: {
          status: next,
          startedAt: next === TripStatus.IN_TRANSIT ? new Date() : trip.startedAt,
          deliveredAt: next === TripStatus.DELIVERED ? new Date() : trip.deliveredAt,
        },
      });
      await tx.tripEvent.create({ data: { tripId, status: next } });

      // Keep the parent Job status in lockstep with the trip milestones.
      if (next === TripStatus.IN_TRANSIT) {
        await tx.job.update({ where: { id: trip.jobId }, data: { status: JobStatus.IN_TRANSIT } });
      } else if (next === TripStatus.DELIVERED) {
        await tx.job.update({ where: { id: trip.jobId }, data: { status: JobStatus.DELIVERED } });
      }
    });

    this.realtime.emitToTrip(tripId, {
      type: 'trip:status',
      tripId,
      status: next,
      at: new Date().toISOString(),
    });
    return { ok: true, status: next };
  }
}
