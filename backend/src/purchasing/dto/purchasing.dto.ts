import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseOrderItemDto {
  @IsString() ingredientId: string;
  @Type(() => Number)
  @IsNumber() quantity: number;
  @Type(() => Number)
  @IsNumber() unitCost: number;
}

export class CreatePurchaseOrderDto {
  @IsString() branchId: string;
  @IsString() supplierId: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class ReceiveItemDto {
  @IsString() purchaseOrderItemId: string;
  @Type(() => Number)
  @IsNumber() receivedQty: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
}

export class CreateSupplierDto {
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() paymentTerms?: string;
}
