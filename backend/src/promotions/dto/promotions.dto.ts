import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum PromotionTypeEnum {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum DiscountScopeEnum {
  ALL_ITEMS = 'ALL_ITEMS',
  FIRST_ITEM = 'FIRST_ITEM',
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

  @IsOptional()
  @IsIn(['ALL_ITEMS', 'FIRST_ITEM'])
  discountScope?: 'ALL_ITEMS' | 'FIRST_ITEM';

  @IsOptional()
  @IsString()
  raffleRewardType?: string;
}

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PromotionTypeEnum)
  type?: PromotionTypeEnum;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value?: number;

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

  @IsOptional()
  @IsIn(['ALL_ITEMS', 'FIRST_ITEM'])
  discountScope?: 'ALL_ITEMS' | 'FIRST_ITEM';

  @IsOptional()
  @IsString()
  raffleRewardType?: string;
}
