import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class RaffleRequestOtpDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsOptional()
  @IsBoolean()
  refreshCode?: boolean;
}

export class RaffleVerifyDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  @Matches(/^[A-Z0-9]+$/, { message: 'Access code must be 8 uppercase alphanumeric characters.' })
  accessCode!: string;

  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class RaffleSpinDto {
  @IsString()
  @IsNotEmpty()
  accessCode: string;
}
