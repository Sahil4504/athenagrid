import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { StorageService } from './storage.service';

@Module({
  imports: [UsersModule],
  controllers: [VerificationController],
  providers: [VerificationService, StorageService],
})
export class VerificationModule {}
