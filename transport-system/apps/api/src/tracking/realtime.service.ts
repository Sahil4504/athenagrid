import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import { RealtimeEvent, room } from '@athenagrid/shared';

/**
 * Thin publisher used by domain services (bids, tracking) to push realtime events
 * into rooms. The gateway registers the live Socket.IO server here on init.
 */
@Injectable()
export class RealtimeService {
  private server?: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitToJob(jobId: string, event: RealtimeEvent) {
    this.server?.to(room.job(jobId)).emit(event.type, event);
  }

  emitToTrip(tripId: string, event: RealtimeEvent) {
    this.server?.to(room.trip(tripId)).emit(event.type, event);
  }
}
