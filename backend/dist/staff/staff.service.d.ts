import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/staff.dto';
export declare class StaffService {
    private prisma;
    constructor(prisma: PrismaService);
    createShift(dto: CreateShiftDto): Promise<{
        role: import("@prisma/client").$Enums.Role;
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        slot: import("@prisma/client").$Enums.ShiftSlot;
        startTime: string;
        endTime: string;
    }>;
    findShifts(branchId: string, weekStart?: string, page?: number, limit?: number): Promise<{
        role: import("@prisma/client").$Enums.Role;
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        slot: import("@prisma/client").$Enums.ShiftSlot;
        startTime: string;
        endTime: string;
    }[]>;
    updateShift(id: string, data: Partial<CreateShiftDto>): Promise<{
        role: import("@prisma/client").$Enums.Role;
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        slot: import("@prisma/client").$Enums.ShiftSlot;
        startTime: string;
        endTime: string;
    }>;
    clockIn(userId: string, branchId: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        userId: string;
        notes: string | null;
        clockIn: Date;
        clockOut: Date | null;
        lateMinutes: number;
    }>;
    clockOut(userId: string, notes?: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        userId: string;
        notes: string | null;
        clockIn: Date;
        clockOut: Date | null;
        lateMinutes: number;
    }>;
    getActiveAttendance(userId: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        userId: string;
        notes: string | null;
        clockIn: Date;
        clockOut: Date | null;
        lateMinutes: number;
    } | null>;
    findAttendance(branchId: string, date: string, page?: number, limit?: number): Promise<({
        user: {
            name: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
        };
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        userId: string;
        notes: string | null;
        clockIn: Date;
        clockOut: Date | null;
        lateMinutes: number;
    })[]>;
    getAttendanceExceptions(branchId: string, date: string, page?: number, limit?: number): Promise<({
        user: {
            name: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
        };
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        userId: string;
        notes: string | null;
        clockIn: Date;
        clockOut: Date | null;
        lateMinutes: number;
    })[]>;
    getDailyLaborRatio(branchId: string, date: string): Promise<{
        totalSales: number;
        totalHours: number;
        staffCount: number;
        laborRatio: number;
    }>;
}
