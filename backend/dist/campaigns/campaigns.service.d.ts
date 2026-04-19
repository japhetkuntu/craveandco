import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/campaigns.dto';
export declare class CampaignsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateCampaignDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CampaignStatus;
        type: import("@prisma/client").$Enums.CampaignType;
        message: string | null;
        segmentRule: import("@prisma/client/runtime/library").JsonValue | null;
        scheduledAt: Date | null;
        sentCount: number;
        openCount: number;
        redeemCount: number;
        launchedAt: Date | null;
        completedAt: Date | null;
    }>;
    findAll(page?: number, limit?: number): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CampaignStatus;
        type: import("@prisma/client").$Enums.CampaignType;
        message: string | null;
        segmentRule: import("@prisma/client/runtime/library").JsonValue | null;
        scheduledAt: Date | null;
        sentCount: number;
        openCount: number;
        redeemCount: number;
        launchedAt: Date | null;
        completedAt: Date | null;
    }[]>;
    launch(id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.CampaignStatus;
        type: import("@prisma/client").$Enums.CampaignType;
        message: string | null;
        segmentRule: import("@prisma/client/runtime/library").JsonValue | null;
        scheduledAt: Date | null;
        sentCount: number;
        openCount: number;
        redeemCount: number;
        launchedAt: Date | null;
        completedAt: Date | null;
    }>;
    getPerformance(id: string): Promise<{
        id: string;
        name: string;
        status: import("@prisma/client").$Enums.CampaignStatus;
        sentCount: number;
        openCount: number;
        redeemCount: number;
        openRate: number;
        redeemRate: number;
    }>;
}
