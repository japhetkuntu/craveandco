"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StaffService = class StaffService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createShift(dto) {
        return this.prisma.shift.create({
            data: { ...dto, date: new Date(dto.date) },
        });
    }
    async findShifts(branchId, weekStart, page = 0, limit = 10) {
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
    async updateShift(id, data) {
        return this.prisma.shift.update({ where: { id }, data });
    }
    async clockIn(userId, branchId) {
        const existing = await this.prisma.attendanceLog.findFirst({
            where: { userId, clockOut: null },
        });
        if (existing)
            throw new common_1.BadRequestException('Already clocked in');
        return this.prisma.attendanceLog.create({
            data: { userId, branchId, clockIn: new Date() },
        });
    }
    async clockOut(userId, notes) {
        const log = await this.prisma.attendanceLog.findFirst({
            where: { userId, clockOut: null },
            orderBy: { clockIn: 'desc' },
        });
        if (!log)
            throw new common_1.BadRequestException('No active clock-in found');
        return this.prisma.attendanceLog.update({
            where: { id: log.id },
            data: { clockOut: new Date(), notes },
        });
    }
    async getActiveAttendance(userId) {
        return this.prisma.attendanceLog.findFirst({
            where: { userId, clockOut: null },
            orderBy: { clockIn: 'desc' },
        });
    }
    async findAttendance(branchId, date, page = 0, limit = 10) {
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
    async getAttendanceExceptions(branchId, date, page = 0, limit = 10) {
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
            take,
            skip,
        });
    }
    async getDailyLaborRatio(branchId, date) {
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
            if (!log.clockOut)
                return sum;
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
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffService);
//# sourceMappingURL=staff.service.js.map