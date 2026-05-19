import { IsEnum, IsOptional, IsString, IsNumber, IsDateString, Min } from 'class-validator';
import { AcquisitionType, AcquisitionSource, BusinessLeadStatus } from '@prisma/client';

export class LogAcquisitionDto {
  @IsEnum(AcquisitionType)
  type: AcquisitionType;

  @IsEnum(AcquisitionSource)
  source: AcquisitionSource;

  @IsDateString()
  date: string;

  // For INDIVIDUAL
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  // For BUSINESS
  @IsOptional()
  @IsString()
  businessLeadId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateBusinessLeadDto {
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}

export class UpdateBusinessLeadDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsEnum(BusinessLeadStatus)
  status?: BusinessLeadStatus;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}

export class AddInteractionDto {
  @IsString()
  businessLeadId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  outcome?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpsertTargetDto {
  @IsString()
  userId: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  individualTarget: number;

  @IsNumber()
  @Min(0)
  businessTarget: number;
}
