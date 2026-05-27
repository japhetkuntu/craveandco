import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, SendSmsDto, UpdateCustomerDto } from './dto/customers.dto';
import { Prisma } from '@prisma/client';
export declare class CustomersService {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: ConfigService);
    private parseBirthday;
    create(dto: CreateCustomerDto): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        birthday: Date | null;
        firstSeenAt: Date;
        lastSeenAt: Date;
        totalSpend: Prisma.Decimal;
        visitCount: number;
    }>;
    update(id: string, dto: UpdateCustomerDto): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        birthday: Date | null;
        firstSeenAt: Date;
        lastSeenAt: Date;
        totalSpend: Prisma.Decimal;
        visitCount: number;
    }>;
    findAll(params?: {
        segment?: string;
        search?: string;
        sortBy?: string;
        sortDir?: 'asc' | 'desc';
        lastSeenBefore?: string;
        addedAfter?: string;
        addedBefore?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        birthday: Date | null;
        firstSeenAt: Date;
        lastSeenAt: Date;
        totalSpend: Prisma.Decimal;
        visitCount: number;
    }[] | {
        totalSpend: number;
        visitCount: number;
        loyaltyPoints: number;
        totalDiscount: number;
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        birthday: Date | null;
        firstSeenAt: Date;
        lastSeenAt: Date;
    }[]>;
    findById(id: string): Promise<{
        loyaltyPoints: number;
        totalDiscount: number;
        orders: ({
            items: {
                quantity: number;
                unitPrice: Prisma.Decimal;
            }[];
        } & {
            branchId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string | null;
            notes: string | null;
            channel: import("@prisma/client").$Enums.OrderChannel;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
            guestName: string | null;
            status: import("@prisma/client").$Enums.OrderStatus;
            paymentLabel: string | null;
            receiptUrl: string | null;
            promotionId: string | null;
            total: Prisma.Decimal;
            foodCost: Prisma.Decimal;
            paymentReference: string | null;
            paymentStatus: string | null;
            initiatedById: string | null;
            paidAt: Date | null;
        })[];
        loyaltyTransactions: {
            id: string;
            createdAt: Date;
            customerId: string;
            type: import("@prisma/client").$Enums.LoyaltyTxType;
            points: number;
            reference: string | null;
        }[];
        feedbackTickets: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            status: import("@prisma/client").$Enums.FeedbackStatus;
            subject: string;
            body: string | null;
            resolution: string | null;
            resolvedAt: Date | null;
        }[];
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        birthday: Date | null;
        firstSeenAt: Date;
        lastSeenAt: Date;
        totalSpend: Prisma.Decimal;
        visitCount: number;
    } | null>;
    private getCustomerStatus;
    getInsights(customerId: string): Promise<{
        customerId: string;
        customerName: string;
        lastOrderAt: string | null;
        daysSinceLastOrder: number | null;
        totalOrders: number;
        ordersLast30Days: number;
        ordersLast60Days: number;
        ordersLast90Days: number;
        averageOrderValue: number;
        totalSpend: number;
        averageDaysBetweenOrders: number | null;
        favoriteCategory: string;
        topItems: {
            name: string;
            quantity: number;
            spend: number;
        }[];
        channelBreakdown: {
            channel: string;
            count: number;
            sharePercent: number;
        }[];
        customerStatus: string;
        preferredContact: string;
        recommendedMessage: string;
        birthday: string | null;
    }>;
    getChurnRisk(): Promise<{
        email: string | null;
        name: string;
        phone: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        birthday: Date | null;
        firstSeenAt: Date;
        lastSeenAt: Date;
        totalSpend: Prisma.Decimal;
        visitCount: number;
    }[]>;
    getUpcomingBirthdays(days?: number): Promise<any[]>;
    getDashboard(): Promise<{
        total: number;
        newThisWeek: number;
        activeThisMonth: number;
        churnRisk: number;
        totalSpend: number;
        averageSpend: number;
        totalVisits: number;
        averageVisits: number;
    }>;
    sendSms(dto: SendSmsDto): Promise<{
        sent: number;
        failed: number;
        noPhone: string[];
    }>;
}
