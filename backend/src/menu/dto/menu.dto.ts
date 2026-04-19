import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsArray } from 'class-validator';

export class CreateMenuItemDto {
  @IsString() categoryId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() price: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @IsArray() dayparts?: string[];
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() available?: boolean;
  @IsOptional() @IsArray() dayparts?: string[];
}

export class CreateCategoryDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
}
