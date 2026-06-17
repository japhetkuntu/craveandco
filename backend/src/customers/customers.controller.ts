import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, SendSmsDto, UpdateCustomerDto } from './dto/customers.dto';

@Controller('api/v1/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD', 'SALES_EXECUTIVE')
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customers.create(dto);
  }

  @Get()
  findAll(
    @Query('segment') segment?: string,
    @Query('status') status?: string,
    @Query('hasPhone') hasPhone?: string,
    @Query('hasEmail') hasEmail?: string,
    @Query('hasBirthday') hasBirthday?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: 'asc' | 'desc',
    @Query('lastSeenAfter') lastSeenAfter?: string,
    @Query('lastSeenBefore') lastSeenBefore?: string,
    @Query('addedAfter') addedAfter?: string,
    @Query('addedBefore') addedBefore?: string,
    @Query('minVisits') minVisits?: string,
    @Query('maxVisits') maxVisits?: string,
    @Query('minTotalSpend') minTotalSpend?: string,
    @Query('maxTotalSpend') maxTotalSpend?: string,
    @Query('minLoyaltyPoints') minLoyaltyPoints?: string,
    @Query('maxLoyaltyPoints') maxLoyaltyPoints?: string,
    @Query('minTotalDiscount') minTotalDiscount?: string,
    @Query('maxTotalDiscount') maxTotalDiscount?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page === undefined ? undefined : Math.max(parseInt(page, 10) || 0, 0);
    const limitNumber = limit === undefined ? undefined : Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    return this.customers.findAll({
      segment,
      status,
      hasPhone,
      hasEmail,
      hasBirthday,
      search,
      sortBy,
      sortDir,
      lastSeenAfter,
      lastSeenBefore,
      addedAfter,
      addedBefore,
      minVisits,
      maxVisits,
      minTotalSpend,
      maxTotalSpend,
      minLoyaltyPoints,
      maxLoyaltyPoints,
      minTotalDiscount,
      maxTotalDiscount,
      page: pageNumber,
      limit: limitNumber,
    });
  }

  @Get('upcoming-birthdays')
  getUpcomingBirthdays(@Query('days') days = '7') {
    const daysNum = Math.min(Math.max(parseInt(days, 10) || 7, 1), 30);
    return this.customers.getUpcomingBirthdays(daysNum);
  }

  @Get('dashboard')
  getDashboard() {
    return this.customers.getDashboard();
  }

  @Get(':id/insights')
  getInsights(@Param('id') id: string) {
    return this.customers.getInsights(id);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.customers.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }

  @Delete(':id')
  @Roles('OWNER')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    return this.customers.delete(id);
  }

  @Post('sms')
  @Roles('OWNER')
  sendSms(@Body() dto: SendSmsDto) {
    return this.customers.sendSms(dto);
  }
}
