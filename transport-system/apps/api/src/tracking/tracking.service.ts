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

  /** Trips visible to the caller: a driver's assigned trips, or a shipper's job trips. */
  async listTrips(userId: string, role: string) {
    if (role === 'DRIVER') {
      const driver = await this.prisma.driverProfile.findUnique({ where: { userId } });
      if (!driver) return [];
      return this.prisma.trip.findMany({
        where: { driverId: driver.id },
        include: { job: { include: { settlement: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (role === 'SHIPPER') {
      return this.prisma.trip.findMany({
        where: { job: { shipperId: userId } },
        include: { job: { include: { settlement: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return [];
  }

  /** Verify the caller is the driver assigned to this trip (company driver or individual). */
  private async assertAssignedDriver(tripId: string, userId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { driver: { select: { userId: true } } },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (!trip.driver || trip.driver.userId !== userId) {
      throw new ForbiddenException('You are not the driver assigned to this trip');
    }
    return trip;
  }

  /** Append a location ping and rebroadcast to the trip room. */
  async recordLocation(driverUserId: string, tripId: string, lat: number, lng: number) {
    await this.assertAssignedDriver(tripId, driverUserId);

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
    const trip = await this.assertAssignedDriver(tripId, requesterUserId);

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
