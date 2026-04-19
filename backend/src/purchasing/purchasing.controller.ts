import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { PurchasingService } from './purchasing.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto, CreateSupplierDto } from './dto/purchasing.dto';
import { Role } from '@prisma/client';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'OPERATIONS_MANAGER')
export class PurchasingController {
  constructor(private purchasing: PurchasingService) {}

  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto) {
    return this.purchasing.createSupplier(dto);
  }

  @Get('suppliers')
  findSuppliers(
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.purchasing.findSuppliers(pageNumber, limitNumber);
  }

  @Post('purchase-orders')
  createPurchaseOrder(
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: Role,
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.purchasing.createPurchaseOrder(dto, userId, role);
  }

  @Post('purchase-orders/:id/receive')
  @Roles('OWNER')
  receivePurchaseOrder(@Param('id') id: string, @Body() dto: ReceivePurchaseOrderDto) {
    return this.purchasing.receivePurchaseOrder(id, dto);
  }

  @Patch('purchase-orders/:id/send')
  sendPurchaseOrder(@Param('id') id: string) {
    return this.purchasing.sendPurchaseOrder(id);
  }

  @Get('purchase-orders')
  findPurchaseOrders(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.purchasing.findPurchaseOrders(branchId, pageNumber, limitNumber);
  }
}
