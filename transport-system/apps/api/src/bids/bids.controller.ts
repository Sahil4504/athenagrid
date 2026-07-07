import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@athenagrid/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BidsService } from './bids.service';
import { AwardDto, PlaceBidDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BidsController {
  constructor(private readonly bids: BidsService) {}

  @Get('jobs/:jobId/bids')
  list(@CurrentUser() user: JwtPayload, @Param('jobId') jobId: string) {
    return this.bids.listForJob(jobId, user.sub, user.role);
  }

  @Post('jobs/:jobId/bids')
  @Roles(UserRole.CARRIER)
  place(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() dto: PlaceBidDto,
  ) {
    return this.bids.placeBid(user.sub, jobId, dto);
  }

  @Delete('bids/:id')
  @Roles(UserRole.CARRIER)
  withdraw(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.bids.withdraw(user.sub, id);
  }

  @Post('jobs/:jobId/award')
  @Roles(UserRole.SHIPPER)
  award(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() dto: AwardDto,
  ) {
    return this.bids.award(user.sub, jobId, dto);
  }
}
