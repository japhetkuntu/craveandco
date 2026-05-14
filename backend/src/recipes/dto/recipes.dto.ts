import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRecipeItemDto {
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsOptional()
  @IsString()
  ingredientName?: string;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class UpdateRecipeItemDto {
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsOptional()
  @IsString()
  ingredientName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class ImportRecipeItemsDto {
  @IsOptional()
  @IsString()
  sourceMenuItemId: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  sourceMenuItemIds?: string[];

  @IsOptional()
  @IsIn(['SNAPSHOT', 'GROUPED'])
  importMode?: 'SNAPSHOT' | 'GROUPED';
}
