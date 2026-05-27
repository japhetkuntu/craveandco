import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
    @Query('lastSeenBefore') lastSeenBefore?: string,
    @Query('addedAfter') addedAfter?: string,
    @Query('addedBefore') addedBefore?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    return this.customers.findAll({
      segment,
      status,
      hasPhone,
      hasEmail,
      hasBirthday,
      search,
      sortBy,
      sortDir,
      lastSeenBefore,
      addedAfter,
      addedBefore,
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

  @Post('sms')
  @Roles('OWNER')
  sendSms(@Body() dto: SendSmsDto) {
    return this.customers.sendSms(dto);
  }
}
