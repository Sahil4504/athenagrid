import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { JobsModule } from './jobs/jobs.module';
import { BidsModule } from './bids/bids.module';
import { TrackingModule } from './tracking/tracking.module';
import { GeoModule } from './geo/geo.module';
import { PricingModule } from './pricing/pricing.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    PrismaModule,
    GeoModule,
    PricingModule,
    AuthModule,
    UsersModule,
    VerificationModule,
    JobsModule,
    BidsModule,
    TrackingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
