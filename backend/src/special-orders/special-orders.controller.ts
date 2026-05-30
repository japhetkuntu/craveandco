import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { SpecialOrdersService } from './special-orders.service';
import {
  CreateSpecialOrderDto,
  CreateDraftSpecialOrderDto,
  UpdateSpecialOrderStatusDto,
  UpdateSpecialOrderItemPricesDto,
  PreviewSpecialOrderPricingDto,
} from './dto/special-orders.dto';

@Controller('api/v1/special-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecialOrdersController {
  constructor(private service: SpecialOrdersService) {}

  @Post('pricing/preview')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD')
  previewPricing(@Body() dto: PreviewSpecialOrderPricingDto) {
    return this.service.previewPricing(dto.items);
  }

  // Ops / Owner: create with full prices immediately
  @Post()
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  create(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSpecialOrderDto,
  ) {
    return this.service.create(dto, branchId, userId);
  }

  // Growth Lead: create draft without prices
  @Post('draft')
  @Roles('GROWTH_LEAD')
  createDraft(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDraftSpecialOrderDto,
  ) {
    return this.service.createDraft(dto, branchId, userId);
  }

  // Ops / Owner: all orders
  @Get()
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  findAll(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.findAll(branchId, normalizePage(page), normalizeLimit(limit, 20), status, from, to);
  }

  // Growth Lead: their own orders only (prices stripped)
  @Get('my')
  @Roles('GROWTH_LEAD')
  findMine(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('userId') userId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '20',
  ) {
    return this.service.findMine(branchId, userId, normalizePage(page), normalizeLimit(limit));
  }

  @Get(':id')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  findOne(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.service.findOne(id, branchId);
  }

  // Ops / Owner: set prices on a draft order
  @Patch(':id/prices')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  updateItemPrices(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @Body() dto: UpdateSpecialOrderItemPricesDto,
  ) {
    return this.service.updateItemPrices(id, branchId, dto);
  }

  // Ops / Owner: approve a draft (DRAFT → PENDING)
  @Patch(':id/approve')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  approve(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.service.approve(id, branchId);
  }

  @Patch(':id/status')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @Body() dto: UpdateSpecialOrderStatusDto,
  ) {
    return this.service.updateStatus(id, branchId, dto.status);
  }
}
