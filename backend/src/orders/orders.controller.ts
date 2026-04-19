import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemsDto, PayOrderDto, AddOrderItemDto } from './dto/orders.dto';

@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD')
  create(@Body() dto: CreateOrderDto) {
    return this.orders.create(dto);
  }

  @Get('live')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF', 'GROWTH_LEAD')
  findLive(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    return this.orders.findLive(branchId, pageNumber, limitNumber);
  }

  @Get(':id')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD', 'KITCHEN_STAFF')
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Patch(':id/status')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF', 'GROWTH_LEAD')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto);
  }

  @Patch(':id/items')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD')
  updateItems(@Param('id') id: string, @Body() dto: UpdateOrderItemsDto) {
    return this.orders.updateItems(id, dto);
  }

  @Post(':id/items')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD')
  addItem(@Param('id') id: string, @Body() dto: AddOrderItemDto) {
    return this.orders.addItem(id, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.orders.removeItem(id, itemId);
  }

  @Post(':id/pay')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD')
  pay(@Param('id') id: string, @Body() dto: PayOrderDto) {
    return this.orders.pay(id, dto);
  }

  @Get()
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD')
  findAll(
    @CurrentUser('branchId') branchId: string,
    @Query('status') status?: string,
    @Query('channel') channel?: string,
    @Query('paymentMethod') paymentMethod?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    return this.orders.findAll(branchId, { status, channel, paymentMethod, from, to, search }, pageNumber, limitNumber);
  }

  @Post(':id/cancel')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD')
  cancel(@Param('id') id: string) {
    return this.orders.cancel(id);
  }
}
