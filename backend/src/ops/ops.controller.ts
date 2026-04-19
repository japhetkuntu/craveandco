import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { OpsService } from './ops.service';

@Controller('api/v1/ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPERATIONS_MANAGER', 'OWNER')
export class OpsController {
  constructor(private ops: OpsService) {}

  @Get('command-center')
  getCommandCenter(
    @CurrentUser('branchId') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('date') date?: string,
  ) {
    return this.ops.getCommandCenter(branchId, from, to, date);
  }

  @Get('service-timeline')
  getServiceTimeline(
    @CurrentUser('branchId') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('date') date?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit, 50);
    return this.ops.getServiceTimeline(branchId, from, to, date, pageNumber, limitNumber);
  }

  @Post('day-close')
  dayClose(@CurrentUser('branchId') branchId: string, @CurrentUser('userId') userId: string) {
    return this.ops.dayClose(branchId, userId);
  }

  @Get('day-close-summary')
  getDayCloseSummary(
    @CurrentUser('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    return this.ops.getDayCloseSummary(branchId, date);
  }

  @Get('checklists')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  getChecklists(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') role: string,
    @Query('date') date: string,
  ) {
    const userId = role === 'KITCHEN_STAFF' ? currentUserId : undefined;
    return this.ops.getChecklists(branchId, date, userId);
  }

  @Get('checklists/history')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  getChecklistHistory(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') role: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
  ) {
    const effectiveUserId = role === 'OWNER' || role === 'OPERATIONS_MANAGER' ? userId : currentUserId;
    return this.ops.getChecklistHistory(branchId, effectiveUserId, from, to);
  }

  @Post('checklists')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  saveChecklists(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: { date: string; lists: Record<string, unknown> },
  ) {
    return this.ops.saveChecklists(branchId, userId, body.date, body.lists);
  }
}
