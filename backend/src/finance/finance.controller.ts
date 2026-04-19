import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { FinanceService } from './finance.service';
import { CreateExpenseDto, ReconcileCashDto, ApproveExpenseDto } from './dto/finance.dto';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private finance: FinanceService) {}

  @Post('expenses')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  createExpense(
    @CurrentUser('userId') userId: string,
    @CurrentUser('branchId') branchId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.finance.createExpense(userId, branchId, dto);
  }

  @Get('expenses')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'ACCOUNTANT')
  findExpenses(
    @CurrentUser('branchId') branchId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.finance.findExpenses(branchId, from, to, pageNumber, limitNumber);
  }

  @Patch('expenses/:id/approve')
  @Roles('OWNER')
  approveExpense(@Param('id') id: string, @Body() dto: ApproveExpenseDto) {
    return this.finance.approveExpense(id, dto.approved);
  }

  @Post('cash/reconcile')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  reconcileCash(
    @CurrentUser('userId') userId: string,
    @Body() dto: ReconcileCashDto,
  ) {
    return this.finance.reconcileCash(dto, userId);
  }

  @Get('finance/daily-summary')
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'ACCOUNTANT')
  getDailySummary(
    @CurrentUser('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    return this.finance.getDailySummary(branchId, date);
  }
}
