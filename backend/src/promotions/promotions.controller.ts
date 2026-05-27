import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotions.dto';

@Controller('api/v1/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionsController {
  constructor(private promotions: PromotionsService) {}

  @Post()
  @Roles('OWNER')
  create(
    @Body() dto: CreatePromotionDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.promotions.create(dto, branchId);
  }

  @Get()
  @Roles('OWNER', 'GROWTH_LEAD')
  findAll(@CurrentUser('branchId') branchId: string) {
    return this.promotions.findAll(branchId);
  }

  @Get('active')
  @Roles('OWNER', 'GROWTH_LEAD', 'OPERATIONS_MANAGER', 'SALES_EXECUTIVE')
  findActive(@CurrentUser('branchId') branchId: string) {
    return this.promotions.findActive(branchId);
  }

  @Get('analytics')
  @Roles('OWNER', 'GROWTH_LEAD')
  getAnalytics(
    @CurrentUser('branchId') branchId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const today = new Date().toISOString().split('T')[0];
    return this.promotions.getAnalytics(branchId, from || today, to || today);
  }

  @Patch(':id')
  @Roles('OWNER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.promotions.update(id, dto, branchId);
  }

  @Patch(':id/activate')
  @Roles('OWNER')
  activate(@Param('id') id: string, @CurrentUser('branchId') branchId: string) {
    return this.promotions.activate(id, branchId);
  }
  @Patch(':id/pause')
  @Roles('OWNER')
  pause(@Param('id') id: string, @CurrentUser('branchId') branchId: string) {
    return this.promotions.pause(id, branchId);
  }

  @Patch(':id/deactivate')
  @Roles('OWNER')
  deactivate(@Param('id') id: string, @CurrentUser('branchId') branchId: string) {
    return this.promotions.deactivate(id, branchId);
  }

  @Delete(':id')
  @Roles('OWNER')
  remove(@Param('id') id: string, @CurrentUser('branchId') branchId: string) {
    return this.promotions.remove(id, branchId);
  }
}
