import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSpecialOrderItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsNumber()
  @Min(0)
  sellPrice: number;
}

export class CreateSpecialOrderDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSpecialOrderItemDto)
  items: CreateSpecialOrderItemDto[];
}

// ── Draft creation (Growth Lead) — no prices ──────────────────────────────────

export class CreateDraftItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;
}

export class CreateDraftSpecialOrderDto {
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDraftItemDto)
  items: CreateDraftItemDto[];
}

// ── Price update (Ops / Owner) ────────────────────────────────────────────────

export class UpdateItemPriceDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsNumber()
  @Min(0)
  sellPrice: number;
}

export class UpdateSpecialOrderItemPricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateItemPriceDto)
  items: UpdateItemPriceDto[];
}

// ── Status update ─────────────────────────────────────────────────────────────

export class UpdateSpecialOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

// ── Pricing preview (backend-authoritative metrics) ─────────────────────────

export class SpecialOrderPricingItemDto {
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsNumber()
  @Min(0)
  sellPrice: number;
}

export class PreviewSpecialOrderPricingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialOrderPricingItemDto)
  items: SpecialOrderPricingItemDto[];
}
