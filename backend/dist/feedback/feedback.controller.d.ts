import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, ResolveFeedbackDto } from './dto/feedback.dto';
export declare class FeedbackController {
    private feedback;
    constructor(feedback: FeedbackService);
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
    getStats(): Promise<{
        open: number;
        inProgress: number;
        resolved: number;
        total: number;
    }>;
    findAll(status?: string, search?: string, page?: string, limit?: string): Promise<({
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
