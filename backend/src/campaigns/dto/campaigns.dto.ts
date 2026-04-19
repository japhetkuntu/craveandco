import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { CampaignType } from '@prisma/client';

export class CreateCampaignDto {
  @IsString() name: string;
  @IsEnum(CampaignType) type: CampaignType;
  @IsOptional() @IsString() message?: string;
  @IsOptional() segmentRule?: any;
  @IsOptional() @IsDateString() scheduledAt?: string;
}
