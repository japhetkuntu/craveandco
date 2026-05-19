import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { LoyaltyService } from './loyalty.service';
import { CreateLoyaltyTxDto } from './dto/loyalty.dto';

@Controller('api/v1/loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'GROWTH_LEAD', 'SALES_EXECUTIVE')
export class LoyaltyController {
  constructor(private loyalty: LoyaltyService) {}

  @Post('transactions')
  createTransaction(@Body() dto: CreateLoyaltyTxDto) {
    return this.loyalty.createTransaction(dto);
  }

  @Get('transactions')
  listTransactions(
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.loyalty.listTransactions(pageNumber, limitNumber);
  }

  @Get('summary')
  getSummary(@Query('from') from?: string, @Query('to') to?: string) {
    return this.loyalty.getSummary(from, to);
  }

  @Get('balance/:customerId')
  getBalance(@Param('customerId') customerId: string) {
    return this.loyalty.getCustomerBalance(customerId);
  }
}
