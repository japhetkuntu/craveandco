import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { AlertsService } from './alerts.service';

@Controller('api/v1/alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private alerts: AlertsService) {}

  @Post('rules')
  @Roles('OWNER')
  createRule(@Body() body: { name: string; metric: string; operator: string; threshold: number; severity?: string }) {
    return this.alerts.createRule(body);
  }

  @Get('rules')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  findRules(
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.alerts.findRules(pageNumber, limitNumber);
  }

  @Get()
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  findAlerts(
    @CurrentUser('branchId') branchId: string,
    @Query('status') status?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.alerts.findAlerts(branchId, status, pageNumber, limitNumber);
  }

  @Get('summary')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  getSummary(@CurrentUser('branchId') branchId: string) {
    return this.alerts.getSummary(branchId);
  }

  @Patch(':id/acknowledge')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  acknowledgeAlert(@Param('id') id: string) {
    return this.alerts.acknowledgeAlert(id);
  }

  @Patch(':id/resolve')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  resolveAlert(@Param('id') id: string) {
    return this.alerts.resolveAlert(id);
  }
}
