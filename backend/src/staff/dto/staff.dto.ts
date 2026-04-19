import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Role, ShiftSlot } from '@prisma/client';

export class CreateShiftDto {
  @IsString() branchId: string;
  @IsEnum(Role) role: Role;
  @IsEnum(ShiftSlot) slot: ShiftSlot;
  @IsDateString() date: string;
  @IsString() startTime: string;
  @IsString() endTime: string;
}

export class ClockInDto {
  @IsString() branchId: string;
}

export class ClockOutDto {
  @IsOptional() @IsString() notes?: string;
}
