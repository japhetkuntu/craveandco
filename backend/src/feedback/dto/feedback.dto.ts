import { IsOptional, IsString } from 'class-validator';

export class CreateFeedbackDto {
  @IsString() customerId: string;
  @IsString() subject: string;
  @IsOptional() @IsString() body?: string;
}

export class ResolveFeedbackDto {
  @IsString() resolution: string;
}
