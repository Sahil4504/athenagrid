import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtPayload, UserRole } from '@athenagrid/shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MarketplaceService } from './marketplace.service';
import { CreateOrderDto } from './dto';

@Controller('marketplace')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SHIPPER) // farmer check (shipperType) enforced in the service
export class MarketplaceController {
  constructor(private readonly svc: MarketplaceService) {}

  @Get('industries')
  industries(@CurrentUser() user: JwtPayload, @Query('zip') zip?: string) {
    return this.svc.nearbyIndustries(user.sub, zip);
  }

  @Post('orders')
  createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.svc.createOrder(user.sub, dto);
  }

  @Get('orders')
  orders(@CurrentUser() user: JwtPayload) {
    return this.svc.listOrders(user.sub);
  }
}
