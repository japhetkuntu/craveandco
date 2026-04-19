import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/campaigns.dto';

@Controller('api/v1/campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'GROWTH_LEAD')
export class CampaignsController {
  constructor(private campaigns: CampaignsService) {}

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaigns.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.campaigns.findAll(pageNumber, limitNumber);
  }

  @Post(':id/launch')
  launch(@Param('id') id: string) {
    return this.campaigns.launch(id);
  }

  @Get(':id/performance')
  getPerformance(@Param('id') id: string) {
    return this.campaigns.getPerformance(id);
  }
}
