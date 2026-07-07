import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { JwtPayload, TripStatus, UserRole } from '@athenagrid/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TrackingService } from './tracking.service';

class LocationDto {
  @IsNumber() @Min(-90) @Max(90) lat!: number;
  @IsNumber() @Min(-180) @Max(180) lng!: number;
}
class StatusDto {
  @IsEnum(TripStatus) status!: TripStatus;
}

@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  // A driver sees trips assigned to them; a shipper sees trips for their jobs.
  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.tracking.listTrips(user.sub, user.role);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tracking.getTrip(id);
  }

  // REST fallback for location (WS is primary) — resilient on flaky mobile networks.
  // Ownership-checked in the service: the assigned driver (company driver OR an
  // individual owner-operator) may post, regardless of role label.
  @Post(':id/location')
  location(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: LocationDto) {
    return this.tracking.recordLocation(user.sub, id, dto.lat, dto.lng);
  }

  @Post(':id/status')
  status(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: StatusDto) {
    return this.tracking.advanceStatus(user.sub, id, dto.status);
  }
}
