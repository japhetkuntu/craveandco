import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsString() category: string;
  @IsNumber() amount: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() receiptUrl?: string;
}

export class ReconcileCashDto {
  @IsString() branchId: string;
  @IsDateString() date: string;
  @IsNumber() expectedCash: number;
  @IsNumber() actualCash: number;
  @IsOptional() @IsString() notes?: string;
}

export class ApproveExpenseDto {
  @IsBoolean() approved: boolean;
}
