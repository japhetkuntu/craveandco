import { IsArray, IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCustomerDto {
  @IsString() name: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsDateString() birthday?: string;
}

export class UpdateCustomerDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsDateString() birthday?: string;
}

export class SendSmsDto {
  @IsArray() @IsString({ each: true }) customerIds: string[];
  @IsString() message: string;
}

export class CreateSegmentDto {
  @IsString() name: string;
  @IsOptional() @IsString() lastSeenBefore?: string;
  @IsOptional() minVisits?: number;
  @IsOptional() maxVisits?: number;
}
