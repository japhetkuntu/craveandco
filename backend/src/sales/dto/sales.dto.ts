import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import {
  AcquisitionType,
  AcquisitionSource,
  BusinessLeadStatus,
  SalesPlanPriority,
} from '@prisma/client';

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

export class WeeklyPlanStepDto {
  @IsEnum(AcquisitionType)
  type: AcquisitionType;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsEnum(SalesPlanPriority)
  priority: SalesPlanPriority;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  places: string[];
}

export class UpsertWeeklySalesPlanDto {
  @IsDateString()
  weekStart: string;

  @IsInt()
  @Min(1)
  weeklyTarget: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => WeeklyPlanStepDto)
  steps: WeeklyPlanStepDto[];
}

export class RejectWeeklyPlanDto {
  @IsString()
  comment: string;
}
