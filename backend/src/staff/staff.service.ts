import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/staff.dto';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async createShift(dto: CreateShiftDto) {
    return this.prisma.shift.create({
      data: { ...dto, date: new Date(dto.date) },
    });
  }

  async findShifts(branchId: string, weekStart?: string, page = 0, limit = 10) {
    const start = weekStart ? new Date(weekStart) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.shift.findMany({
      where: { branchId, date: { gte: start, lt: end } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take,
      skip,
    });
  }

  async updateShift(id: string, data: Partial<CreateShiftDto>) {
    return this.prisma.shift.update({ where: { id }, data });
  }

  async clockIn(userId: string, branchId: string) {
    const existing = await this.prisma.attendanceLog.findFirst({
      where: { userId, clockOut: null },
    });
    if (existing) throw new BadRequestException('Already clocked in');
    return this.prisma.attendanceLog.create({
      data: { userId, branchId, clockIn: new Date() },
    });
  }

  async clockOut(userId: string, notes?: string) {
    const log = await this.prisma.attendanceLog.findFirst({
      where: { userId, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });
    if (!log) throw new BadRequestException('No active clock-in found');
    return this.prisma.attendanceLog.update({
      where: { id: log.id },
      data: { clockOut: new Date(), notes },
    });
  }

  async getActiveAttendance(userId: string) {
    return this.prisma.attendanceLog.findFirst({
      where: { userId, clockOut: null },
      orderBy: { clockIn: 'desc' },
    });
  }

  async findAttendance(branchId: string, date: string, page = 0, limit = 10) {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;

    return this.prisma.attendanceLog.findMany({
      where: {
        branchId,
        clockIn: { gte: targetDate, lt: nextDate },
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { clockIn: 'desc' },
      take,
      skip,
    });
  }

  async getAttendanceExceptions(branchId: string, date: string, page = 0, limit = 10) {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.attendanceLog.findMany({
      where: {
        branchId,
        clockIn: { gte: targetDate, lt: nextDate },
        OR: [{ lateMinutes: { gt: 0 } }, { clockOut: null }],
      },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { clockIn: 'desc' },
      take,
      skip,
    });
  }

  async getDailyLaborRatio(branchId: string, date: string) {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const orders = await this.prisma.order.aggregate({
      where: { branchId, createdAt: { gte: targetDate, lt: nextDate } },
      _sum: { total: true },
    });

    const attendance = await this.prisma.attendanceLog.findMany({
      where: { branchId, clockIn: { gte: targetDate, lt: nextDate } },
    });

    const totalHours = attendance.reduce((sum, log) => {
      if (!log.clockOut) return sum;
      return sum + (log.clockOut.getTime() - log.clockIn.getTime()) / 3600000;
    }, 0);

    const totalSales = Number(orders._sum?.total || 0);
    return {
      totalSales,
      totalHours: Math.round(totalHours * 100) / 100,
      staffCount: attendance.length,
      laborRatio: totalSales > 0 ? Math.round((totalHours * 15 / totalSales) * 10000) / 100 : 0,
    };
  }
}
