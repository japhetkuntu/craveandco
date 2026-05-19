import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EngagementService } from './engagement.service';
import { UpsertEngagementDto } from './dto/engagement.dto';

@Controller('api/v1/engagement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  /**
   * GET /api/v1/engagement?date=YYYY-MM-DD&page=0&limit=20&search=
   * Growth Lead: view the daily customer engagement list
   */
  @Get()
  @Roles('GROWTH_LEAD', 'OWNER')
  getDailyList(
    @Request() req: { user: { userId: string; branchId: string } },
    @Query('date') date: string,
    @Query('page') page = '0',
    @Query('limit') limit = '30',
    @Query('search') search?: string,
  ) {
    return this.engagementService.getDailyList(
      req.user.branchId,
      date ?? new Date().toISOString().split('T')[0],
      parseInt(page, 10),
      parseInt(limit, 10),
      search,
    );
  }

  /**
   * PUT /api/v1/engagement/:customerId
   * Growth Lead: log or update engagement for a customer
   */
  @Put(':customerId')
  @Roles('GROWTH_LEAD', 'OWNER')
  upsertLog(
    @Request() req: { user: { userId: string; branchId: string } },
    @Param('customerId') customerId: string,
    @Body() dto: UpsertEngagementDto,
  ) {
    return this.engagementService.upsertLog(
      req.user.branchId,
      customerId,
      req.user.userId,
      dto,
    );
  }

  /**
   * GET /api/v1/engagement/analytics?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Owner: engagement analytics over a date range
   */
  @Get('analytics')
  @Roles('OWNER')
  getAnalytics(
    @Request() req: { user: { userId: string; branchId: string } },
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    return this.engagementService.getAnalytics(
      req.user.branchId,
      from ?? today,
      to ?? today,
    );
  }

  /**
   * GET /api/v1/engagement/daily-summary?date=YYYY-MM-DD
   * Owner: quick widget stats for a single day
   */
  @Get('daily-summary')
  @Roles('OWNER')
  getDailySummary(
    @Request() req: { user: { userId: string; branchId: string } },
    @Query('date') date: string,
  ) {
    return this.engagementService.getDailySummary(
      req.user.branchId,
      date ?? new Date().toISOString().split('T')[0],
    );
  }
}
