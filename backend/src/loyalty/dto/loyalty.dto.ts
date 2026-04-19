import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { LoyaltyTxType } from '@prisma/client';

export class CreateLoyaltyTxDto {
  @IsString() customerId: string;
  @IsNumber() points: number;
  @IsEnum(LoyaltyTxType) type: LoyaltyTxType;
  @IsOptional() @IsString() reference?: string;
}
