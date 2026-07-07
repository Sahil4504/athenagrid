import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@athenagrid/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JobsService } from './jobs.service';
import { CreateJobDto, SearchJobsDto } from './dto';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Post()
  @Roles(UserRole.SHIPPER)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJobDto) {
    return this.jobs.create(user.sub, dto);
  }

  @Get()
  search(@Query() q: SearchJobsDto) {
    return this.jobs.search(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobs.findOne(id);
  }

  @Post(':id/close')
  @Roles(UserRole.SHIPPER)
  close(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.jobs.close(user.sub, id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SHIPPER)
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.jobs.cancel(user.sub, id);
  }
}
