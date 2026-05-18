import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { GrowthService } from './growth.service';

@Controller('api/v1/growth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GROWTH_LEAD', 'OWNER')
export class GrowthController {
  constructor(private growth: GrowthService) {}

  @Get('dashboard')
  getDashboard(
    @CurrentUser('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.growth.getDashboard(branchId, from, to);
  }

  @Get('churn-risk')
  getChurnRisk() {
    return this.growth.getChurnRisk();
  }

  @Get('payment-types')
  getPaymentTypes(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.growth.getPaymentTypes(branchId, pageNumber, limitNumber);
  }
}
