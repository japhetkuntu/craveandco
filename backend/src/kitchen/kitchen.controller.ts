import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { KitchenService } from './kitchen.service';
import {
  CreateHandoverNoteDto,
  CreateShortageRequestDto,
  CreateWasteLogDto,
  UpdateKitchenOrderDto,
} from './dto/kitchen.dto';

@Controller('api/v1/kitchen')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('KITCHEN_STAFF', 'OPERATIONS_MANAGER', 'OWNER')
export class KitchenController {
  constructor(private kitchen: KitchenService) {}

  @Get('orders/live')
  getLiveOrders(
    @CurrentUser('branchId') branchId: string,
    @Query('station') station?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit, 50);
    return this.kitchen.getLiveOrders(branchId, station, pageNumber, limitNumber);
  }

  @Patch('orders/:orderId/status')
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateKitchenOrderDto,
  ) {
    return this.kitchen.updateOrderStatus(orderId, dto.status);
  }

  @Get('prep-list')
  @Roles()
  getPrepList(
    @CurrentUser('branchId') branchId: string,
    @Query('date') date: string,
    @Query('shift') shift?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit, 50);
    return this.kitchen.getPrepList(branchId, date, shift, pageNumber, limitNumber);
  }

  @Post('shortage-requests')
  createShortageRequest(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateShortageRequestDto,
  ) {
    return this.kitchen.createShortageRequest(dto.ingredientId, branchId, dto.reason);
  }

  @Post('waste-logs')
  logWaste(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateWasteLogDto,
  ) {
    return this.kitchen.logWaste(dto.ingredientId, branchId, dto.quantity, dto.reason);
  }

  @Get('waste-logs')
  getWasteLogs(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit, 50);
    return this.kitchen.getWasteLogs(branchId, pageNumber, limitNumber);
  }

  @Get('handover-notes')
  getHandoverNotes(
    @Query('date') date?: string,
    @Query('shift') shift?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit, 50);
    return this.kitchen.getHandoverNotes(date, shift, pageNumber, limitNumber);
  }

  @Post('handover-notes')
  createHandoverNote(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateHandoverNoteDto,
  ) {
    return this.kitchen.createHandoverNote(userId, dto);
  }

  @Get('station-load')
  getStationLoad(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit, 50);
    return this.kitchen.getStationLoad(branchId, pageNumber, limitNumber);
  }
}
