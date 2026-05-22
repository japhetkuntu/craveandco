import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum EngagementChannel {
  CALL = 'CALL',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  IN_PERSON = 'IN_PERSON',
  EMAIL = 'EMAIL',
}

export class UpsertEngagementDto {
  @IsDateString()
  date: string;

  @IsBoolean()
  engaged: boolean;

  @IsOptional()
  @IsDateString()
  engagedAt?: string;

  @IsOptional()
  @IsEnum(EngagementChannel)
  channel?: EngagementChannel;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  reached?: boolean;
}
