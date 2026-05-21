import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { InventoryService } from './inventory.service';
import { CreateIngredientDto, CreateMovementDto, CreateStockCountDto, UpdateIngredientDto } from './dto/inventory.dto';

@Controller('api/v1/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get('ingredients')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  getIngredients(
    @Query('page') page = '0',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.inventory.getIngredients(pageNumber, limitNumber, search);
  }

  @Post('ingredients')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.inventory.createIngredient(dto);
  }

  @Patch('ingredients/:id')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  updateIngredient(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.inventory.updateIngredient(id, dto);
  }

  @Delete('ingredients/:id')
  @Roles('OWNER')
  deleteIngredient(@Param('id') id: string) {
    return this.inventory.deleteIngredient(id);
  }

  @Get('stock')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  getStock(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.inventory.getStock(branchId, pageNumber, limitNumber, search);
  }

  @Post('movements')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  createMovement(@Body() dto: CreateMovementDto) {
    return this.inventory.createMovement(dto);
  }

  @Get('movements')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  getMovements(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.inventory.getMovements(branchId, pageNumber, limitNumber);
  }

  @Get('movements/analytics')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  getMovementAnalytics(@CurrentUser('branchId') branchId: string) {
    return this.inventory.getMovementAnalytics(branchId);
  }

  @Get('alerts/low-stock')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  getLowStock(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.inventory.getLowStock(branchId, pageNumber, limitNumber);
  }

  @Post('stock-counts')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  createStockCount(@Body() dto: CreateStockCountDto) {
    return this.inventory.createStockCount(dto);
  }
}
