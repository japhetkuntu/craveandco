import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RedeemSpinDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}
