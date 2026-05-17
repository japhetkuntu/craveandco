import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { SpecialOrdersService } from './special-orders.service';
import { CreateSpecialOrderDto, UpdateSpecialOrderStatusDto } from './dto/special-orders.dto';

@Controller('api/v1/special-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'OPERATIONS_MANAGER')
export class SpecialOrdersController {
  constructor(private service: SpecialOrdersService) {}

  @Post()
  create(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateSpecialOrderDto,
  ) {
    return this.service.create(dto, branchId, userId);
  }

  @Get()
  findAll(
    @CurrentUser('branchId') branchId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.service.findAll(branchId, normalizePage(page), normalizeLimit(limit), status);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
  ) {
    return this.service.findOne(id, branchId);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId: string,
    @Body() dto: UpdateSpecialOrderStatusDto,
  ) {
    return this.service.updateStatus(id, branchId, dto.status);
  }
}
