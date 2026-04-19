import { StaffService } from './staff.service';
import { CreateShiftDto, ClockInDto, ClockOutDto } from './dto/staff.dto';
export declare class StaffController {
    private staff;
    constructor(staff: StaffService);
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
    findShifts(branchId: string, weekStart?: string, page?: string, limit?: string): Promise<{
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
    clockIn(userId: string, dto: ClockInDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        userId: string;
        notes: string | null;
        clockIn: Date;
        clockOut: Date | null;
        lateMinutes: number;
    }>;
    clockOut(userId: string, dto: ClockOutDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        userId: string;
        notes: string | null;
        clockIn: Date;
        clockOut: Date | null;
        lateMinutes: number;
    }>;
    currentAttendance(userId: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        userId: string;
        notes: string | null;
        clockIn: Date;
        clockOut: Date | null;
        lateMinutes: number;
    } | null>;
    getAttendanceByDate(branchId: string, date: string, page?: string, limit?: string): Promise<({
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
    getAttendanceExceptions(branchId: string, date: string, page?: string, limit?: string): Promise<({
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
