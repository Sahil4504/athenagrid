import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import { JwtPayload, REALTIME_NAMESPACE, room } from '@athenagrid/shared';
import { RealtimeService } from './realtime.service';
import { TrackingService } from './tracking.service';

/**
 * Realtime gateway. Clients connect with a JWT, then join per-job / per-trip rooms.
 * Drivers stream location pings here; everyone in the trip room receives them.
 */
@WebSocketGateway({ namespace: REALTIME_NAMESPACE, cors: { origin: '*' } })
export class TrackingGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(TrackingGateway.name);

  @WebSocketServer() server!: Server;

  constructor(
    private realtime: RealtimeService,
    private tracking: TrackingService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  afterInit(server: Server) {
    // Give the publisher a handle to the live server so HTTP services can emit.
    this.realtime.setServer(server);
  }

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers.authorization || '').replace('Bearer ', '');
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });
      client.data.user = payload;
    } catch {
      client.emit('error', 'unauthorized');
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join:job')
  joinJob(@ConnectedSocket() client: Socket, @MessageBody() jobId: string) {
    client.join(room.job(jobId));
    return { ok: true, room: room.job(jobId) };
  }

  @SubscribeMessage('join:trip')
  joinTrip(@ConnectedSocket() client: Socket, @MessageBody() tripId: string) {
    client.join(room.trip(tripId));
    return { ok: true, room: room.trip(tripId) };
  }

  /** Driver streams a GPS ping over WS (also available as REST for reliability). */
  @SubscribeMessage('trip:ping')
  async ping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { tripId: string; lat: number; lng: number },
  ) {
    const user = client.data.user as JwtPayload;
    await this.tracking.recordLocation(user.sub, body.tripId, body.lat, body.lng);
    return { ok: true };
  }
}
