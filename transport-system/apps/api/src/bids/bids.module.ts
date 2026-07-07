import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TrackingModule } from '../tracking/tracking.module';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';

@Module({
  imports: [UsersModule, TrackingModule],
  controllers: [BidsController],
  providers: [BidsService],
})
export class BidsModule {}
