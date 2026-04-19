import { CampaignType } from '@prisma/client';
export declare class CreateCampaignDto {
    name: string;
    type: CampaignType;
    message?: string;
    segmentRule?: any;
    scheduledAt?: string;
}
