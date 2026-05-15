import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum PromotionTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionTypeEnum)
  type: PromotionTypeEnum;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDiscount?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn(['ALL', 'SPECIFIC'])
  menuScope?: 'ALL' | 'SPECIFIC';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  menuItemIds?: string[];
}
