import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'OPERATIONS_MANAGER', 'ACCOUNTANT')
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('dashboard')
  getDashboard(
    @CurrentUser('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    return this.reports.getDashboard(branchId, date);
  }

  @Get('weekly')
  getWeeklyReport(
    @CurrentUser('branchId') branchId: string,
    @Query('weekStart') weekStart: string,
  ) {
    return this.reports.getWeeklyReport(branchId, weekStart);
  }

  @Get('summary')
  getReportSummary(
    @CurrentUser('branchId') branchId: string,
    @Query('period') period: 'day' | 'week' | 'month' | 'year',
    @Query('date') date: string,
  ) {
    return this.reports.getSummary(branchId, period, date);
  }

  @Get('menu-profitability')
  @Roles('OWNER')
  getMenuProfitability(
    @CurrentUser('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.reports.getMenuProfitability(branchId, from, to);
  }
}
