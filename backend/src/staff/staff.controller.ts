import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { StaffService } from './staff.service';
import { CreateShiftDto, ClockInDto, ClockOutDto } from './dto/staff.dto';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private staff: StaffService) {}

  @Post('shifts')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  createShift(@Body() dto: CreateShiftDto) {
    return this.staff.createShift(dto);
  }

  @Get('shifts')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  findShifts(
    @CurrentUser('branchId') branchId: string,
    @Query('weekStart') weekStart?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.staff.findShifts(branchId, weekStart, pageNumber, limitNumber);
  }

  @Patch('shifts/:id')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  updateShift(@Param('id') id: string, @Body() data: Partial<CreateShiftDto>) {
    return this.staff.updateShift(id, data);
  }

  @Post('attendance/clock-in')
  clockIn(@CurrentUser('userId') userId: string, @Body() dto: ClockInDto) {
    return this.staff.clockIn(userId, dto.branchId);
  }

  @Post('attendance/clock-out')
  clockOut(@CurrentUser('userId') userId: string, @Body() dto: ClockOutDto) {
    return this.staff.clockOut(userId, dto.notes);
  }

  @Get('attendance/active')
  currentAttendance(@CurrentUser('userId') userId: string) {
    return this.staff.getActiveAttendance(userId);
  }

  @Get('attendance')
  getAttendanceByDate(
    @CurrentUser('branchId') branchId: string,
    @Query('date') date: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.staff.findAttendance(branchId, date, pageNumber, limitNumber);
  }

  @Get('attendance/exceptions')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  getAttendanceExceptions(
    @CurrentUser('branchId') branchId: string,
    @Query('date') date: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.staff.getAttendanceExceptions(branchId, date, pageNumber, limitNumber);
  }

  @Get('labor/daily-ratio')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  getDailyLaborRatio(
    @CurrentUser('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    return this.staff.getDailyLaborRatio(branchId, date);
  }
}
