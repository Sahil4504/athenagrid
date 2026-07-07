import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@athenagrid/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VerificationService } from './verification.service';
import { RequestUploadDto, ReviewDecisionDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerificationController {
  constructor(private readonly svc: VerificationService) {}

  // ---- Carrier ----
  @Post('verification/documents')
  @Roles(UserRole.CARRIER)
  requestUpload(@CurrentUser() user: JwtPayload, @Body() dto: RequestUploadDto) {
    return this.svc.requestUpload(user.sub, dto);
  }

  @Get('verification/me')
  @Roles(UserRole.CARRIER)
  myStatus(@CurrentUser() user: JwtPayload) {
    return this.svc.myStatus(user.sub);
  }

  // ---- Admin ----
  @Get('admin/verification/queue')
  @Roles(UserRole.ADMIN)
  queue() {
    return this.svc.queue();
  }

  @Post('admin/verification/:id/decision')
  @Roles(UserRole.ADMIN)
  decide(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewDecisionDto,
  ) {
    return this.svc.decide(user.sub, id, dto);
  }
}
