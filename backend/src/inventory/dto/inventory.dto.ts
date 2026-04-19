import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MovementType } from '@prisma/client';

export class CreateMovementDto {
  @IsString() ingredientId!: string;
  @IsString() branchId!: string;
  @IsEnum(MovementType) type!: MovementType;
  @IsNumber() quantity!: number;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() referenceId?: string;
}

export class CreateStockCountDto {
  @IsString() ingredientId!: string;
  @IsString() branchId!: string;
  @IsNumber() counted!: number;
  @IsNumber() expected!: number;
}

export class CreateIngredientDto {
  @IsString() name!: string;
  @IsString() unit!: string;
  @IsOptional() @IsNumber() currentCost?: number;
  @IsOptional() @IsNumber() reorderLevel?: number;
}

export class UpdateIngredientDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsNumber() currentCost?: number;
  @IsOptional() @IsNumber() reorderLevel?: number;
}
