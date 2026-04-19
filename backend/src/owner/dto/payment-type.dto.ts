import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentTypeDto {
  @IsString()
  name: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

export class UpdatePaymentTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
