import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto, ResolveFeedbackDto } from './dto/feedback.dto';
export declare class FeedbackService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateFeedbackDto): Promise<{
        customer: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            birthday: Date | null;
            firstSeenAt: Date;
            lastSeenAt: Date;
            totalSpend: import("@prisma/client/runtime/library").Decimal;
            visitCount: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        status: import("@prisma/client").$Enums.FeedbackStatus;
        subject: string;
        body: string | null;
        resolution: string | null;
        resolvedAt: Date | null;
    }>;
    findAll(status?: string, page?: number, limit?: number): Promise<({
        customer: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            birthday: Date | null;
            firstSeenAt: Date;
            lastSeenAt: Date;
            totalSpend: import("@prisma/client/runtime/library").Decimal;
            visitCount: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        status: import("@prisma/client").$Enums.FeedbackStatus;
        subject: string;
        body: string | null;
        resolution: string | null;
        resolvedAt: Date | null;
    })[]>;
    resolve(id: string, dto: ResolveFeedbackDto): Promise<{
        customer: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            birthday: Date | null;
            firstSeenAt: Date;
            lastSeenAt: Date;
            totalSpend: import("@prisma/client/runtime/library").Decimal;
            visitCount: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        status: import("@prisma/client").$Enums.FeedbackStatus;
        subject: string;
        body: string | null;
        resolution: string | null;
        resolvedAt: Date | null;
    }>;
}
