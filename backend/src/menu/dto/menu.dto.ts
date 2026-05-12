import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MenuItemOptionValueDto {
  @IsString() label: string;
  @IsOptional() @IsNumber() priceAdjustment?: number;
  @IsOptional() @IsString() id?: string;
}

class MenuItemOptionDto {
  @IsString() name: string;
  @IsOptional() @IsString() label?: string;
  @IsBoolean() required: boolean;
  @IsBoolean() multiple: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemOptionValueDto)
  values: MenuItemOptionValueDto[];
  @IsOptional() @IsString() id?: string;
}

export class CreateMenuItemDto {
  @IsString() categoryId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() price: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @IsArray() dayparts?: string[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemOptionDto)
  options?: MenuItemOptionDto[];
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsArray() dayparts?: string[];
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemOptionDto)
  options?: MenuItemOptionDto[];
}

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}
