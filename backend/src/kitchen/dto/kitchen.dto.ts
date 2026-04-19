import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsPositive, IsString } from 'class-validator';
import { OrderStatus, ShiftSlot } from '@prisma/client';

export class UpdateKitchenOrderDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class CreateShortageRequestDto {
  @IsString()
  ingredientId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateWasteLogDto {
  @IsString()
  ingredientId: string;

  @Type(() => Number)
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class MarkDelayedDto {
  @IsOptional() @IsString() reason?: string;
}

export class CreateHandoverNoteDto {
  @IsEnum(ShiftSlot) shift: ShiftSlot;
  @IsString() content: string;
}
