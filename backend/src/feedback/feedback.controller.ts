import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, ResolveFeedbackDto } from './dto/feedback.dto';

@Controller('api/v1/feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'GROWTH_LEAD', 'OPERATIONS_MANAGER')
export class FeedbackController {
  constructor(private feedback: FeedbackService) {}

  @Post('tickets')
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedback.create(dto);
  }

  @Get('tickets')
  findAll(
    @Query('status') status?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.feedback.findAll(status, pageNumber, limitNumber);
  }

  @Post('tickets/:id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveFeedbackDto) {
    return this.feedback.resolve(id, dto);
  }
}
