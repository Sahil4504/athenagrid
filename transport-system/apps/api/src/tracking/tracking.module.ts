import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeService } from './realtime.service';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { TrackingController } from './tracking.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [TrackingController],
  providers: [RealtimeService, TrackingService, TrackingGateway],
  exports: [RealtimeService, TrackingService],
})
export class TrackingModule {}
