import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { OwnerService } from './owner.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { CreatePaymentTypeDto, UpdatePaymentTypeDto } from './dto/payment-type.dto';

@Controller('api/v1/owner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER')
export class OwnerController {
  constructor(private owner: OwnerService) {}

  @Get('dashboard')
  getDashboard(
    @CurrentUser('branchId') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('date') date?: string,
    @Query('categoryIds') rawCategoryIds?: string | string[],
  ) {
    const categoryIds = rawCategoryIds
      ? (Array.isArray(rawCategoryIds) ? rawCategoryIds : [rawCategoryIds]).filter(Boolean)
      : undefined;
    return this.owner.getDashboard(branchId, from, to, date, categoryIds?.length ? categoryIds : undefined);
  }

  @Get('approvals/pending')
  getPendingApprovals(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.owner.getPendingApprovals(branchId, pageNumber, limitNumber);
  }

  @Post('approvals/:id/approve')
  approve(@Param('id') id: string) {
    return this.owner.approveItem(id, true);
  }

  @Post('approvals/:id/reject')
  reject(@Param('id') id: string) {
    return this.owner.approveItem(id, false);
  }

  @Get('alerts')
  getAlerts(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.owner.getOpenAlerts(branchId, pageNumber, limitNumber);
  }

  // ── Staff CRUD ──────────────────────────────────────
  @Get('staff')
  listStaff(
    @CurrentUser('branchId') branchId: string,
    @Query('showInactive') showInactive = 'false',
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    const includeInactive = showInactive === 'true';
    return this.owner.listStaff(branchId, pageNumber, limitNumber, includeInactive);
  }

  @Post('staff')
  createStaff(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateStaffDto,
  ) {
    return this.owner.createStaff(branchId, dto);
  }

  @Patch('staff/:id')
  updateStaff(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.owner.updateStaff(id, branchId, dto);
  }

  @Delete('staff/:id')
  deactivateStaff(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.owner.deactivateStaff(id, branchId);
  }

  // ── Payment Types CRUD ──────────────────────────────
  @Get('payment-types')
  listPaymentTypes(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.owner.listPaymentTypes(branchId, pageNumber, limitNumber);
  }

  @Post('payment-types')
  createPaymentType(
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreatePaymentTypeDto,
  ) {
    return this.owner.createPaymentType(branchId, dto);
  }

  @Patch('payment-types/:id')
  updatePaymentType(@Param('id') id: string, @Body() dto: UpdatePaymentTypeDto) {
    return this.owner.updatePaymentType(id, dto);
  }

  @Delete('payment-types/:id')
  deletePaymentType(@Param('id') id: string) {
    return this.owner.deletePaymentType(id);
  }
}
