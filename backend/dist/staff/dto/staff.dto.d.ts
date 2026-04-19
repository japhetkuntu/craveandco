import { Role, ShiftSlot } from '@prisma/client';
export declare class CreateShiftDto {
    branchId: string;
    role: Role;
    slot: ShiftSlot;
    date: string;
    startTime: string;
    endTime: string;
}
export declare class ClockInDto {
    branchId: string;
}
export declare class ClockOutDto {
    notes?: string;
}
