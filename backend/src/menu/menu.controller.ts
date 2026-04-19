import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { MenuService } from './menu.service';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/menu.dto';

@Controller('api/v1/menu')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuController {
  constructor(private menu: MenuService) {}

  @Post('categories')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menu.createCategory(dto);
  }

  @Get('categories')
  findCategories(
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit, 50);
    return this.menu.findCategories(pageNumber, limitNumber);
  }

  @Patch('categories/:id')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.menu.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  deleteCategory(@Param('id') id: string) {
    return this.menu.deleteCategory(id);
  }

  @Post('items')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  createItem(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menu.createItem(branchId, dto);
  }

  @Get('items')
  findItems(
    @CurrentUser('branchId') branchId: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    return this.menu.findItems(branchId, categoryId, pageNumber, limitNumber);
  }

  @Patch('items/:id')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMenuItemDto) {
    return this.menu.updateItem(id, dto);
  }

  @Delete('items/:id')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  deleteItem(@Param('id') id: string) {
    return this.menu.deleteItem(id);
  }

  @Patch('items/:id/availability')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  toggleAvailability(@Param('id') id: string) {
    return this.menu.toggleAvailability(id);
  }
}
