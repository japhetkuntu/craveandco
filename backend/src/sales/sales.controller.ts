import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import {
  LogAcquisitionDto,
  CreateBusinessLeadDto,
  UpdateBusinessLeadDto,
  AddInteractionDto,
  UpsertTargetDto,
} from './dto/sales.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ─── EXECUTIVE ENDPOINTS ─────────────────────────────────

  @Get('dashboard')
  @Roles('SALES_EXECUTIVE')
  getDashboard(
    @Req() req: any,
    @Query('date') date: string,
  ) {
    const today = date || new Date().toISOString().slice(0, 10);
    return this.salesService.getDashboard(req.user.userId, req.user.branchId, today);
  }

  @Post('acquisitions')
  @Roles('SALES_EXECUTIVE')
  logAcquisition(@Req() req: any, @Body() dto: LogAcquisitionDto) {
    return this.salesService.logAcquisition(dto, req.user.userId, req.user.branchId);
  }

  @Get('acquisitions')
  @Roles('SALES_EXECUTIVE')
  getAcquisitions(
    @Req() req: any,
    @Query('date') date: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const today = date || new Date().toISOString().slice(0, 10);
    return this.salesService.getAcquisitions(req.user.userId, today, page, limit);
  }

  @Post('leads')
  @Roles('SALES_EXECUTIVE')
  createLead(@Req() req: any, @Body() dto: CreateBusinessLeadDto) {
    return this.salesService.createBusinessLead(dto, req.user.userId, req.user.branchId);
  }

  @Get('leads')
  @Roles('SALES_EXECUTIVE')
  getLeads(
    @Req() req: any,
    @Query('status') status: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.salesService.getBusinessLeads(req.user.userId, status || undefined, page, limit);
  }

  @Patch('leads/:id')
  @Roles('SALES_EXECUTIVE')
  updateLead(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateBusinessLeadDto) {
    return this.salesService.updateBusinessLead(id, dto, req.user.userId);
  }

  @Post('interactions')
  @Roles('SALES_EXECUTIVE')
  addInteraction(@Req() req: any, @Body() dto: AddInteractionDto) {
    return this.salesService.addInteraction(dto, req.user.userId);
  }

  @Get('targets/me')
  @Roles('SALES_EXECUTIVE')
  getMyTarget(
    @Req() req: any,
    @Query('date') date: string,
  ) {
    const today = date || new Date().toISOString().slice(0, 10);
    return this.salesService.getTargetForDate(req.user.userId, today);
  }

  // ─── OWNER ENDPOINTS ─────────────────────────────────────

  @Get('analytics')
  @Roles('OWNER')
  getAnalytics(
    @Req() req: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const today = new Date().toISOString().slice(0, 10);
    return this.salesService.getAnalytics(req.user.branchId, from || today, to || today);
  }

  @Get('executives')
  @Roles('OWNER')
  getSalesExecutives(@Req() req: any) {
    return this.salesService.getSalesExecutives(req.user.branchId);
  }

  @Get('targets')
  @Roles('OWNER')
  getBranchTargets(
    @Req() req: any,
    @Query('date') date: string,
  ) {
    const today = date || new Date().toISOString().slice(0, 10);
    return this.salesService.getTargetsForBranch(req.user.branchId, today);
  }

  @Post('targets')
  @Roles('OWNER')
  upsertTarget(@Body() dto: UpsertTargetDto) {
    return this.salesService.upsertTarget(dto);
  }
}
