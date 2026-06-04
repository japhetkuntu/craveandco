import { CustomersService } from './customers.service';
import { CreateCustomerDto, SendSmsDto, UpdateCustomerDto } from './dto/customers.dto';
export declare class CustomersController {
    private customers;
    constructor(customers: CustomersService);
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
        totalSpend: import("@prisma/client/runtime/library").Decimal;
        visitCount: number;
    }>;
    findAll(segment?: string, status?: string, hasPhone?: string, hasEmail?: string, hasBirthday?: string, search?: string, sortBy?: string, sortDir?: 'asc' | 'desc', lastSeenBefore?: string, addedAfter?: string, addedBefore?: string, page?: string, limit?: string): Promise<{
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
    }[] | {
        totalSpend: number;
        visitCount: number;
        loyaltyPoints: number;
        totalDiscount: number;
        acquisitionSource: string | null;
        acquisitionExecutive: string | null;
        statusTag: string;
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
    getUpcomingBirthdays(days?: string): Promise<any[]>;
    getDashboard(): Promise<{
        total: number;
        newThisWeek: number;
        activeThisWeek: number;
        activeThisMonth: number;
        churnRisk: number;
        totalSpend: number;
        averageSpend: number;
        totalVisits: number;
        averageVisits: number;
        retentionRate: number;
        customerGoal: number;
        progressPercent: number;
        projectedTargetDate: string | null;
        acquisitionTrend: {
            date: string;
            customers: number;
        }[];
    }>;
    getInsights(id: string): Promise<{
        customerId: string;
        customerName: string;
        lastOrderAt: string | null;
        daysSinceLastOrder: number | null;
        totalOrders: number;
        ordersLast7Days: number;
        ordersLast14Days: number;
        ordersLast21Days: number;
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
        acquisitionSource: import("@prisma/client").$Enums.AcquisitionSource | null;
        acquisitionExecutive: string | null;
        bestTimeToReengage: string;
        churnScore: number;
        orderFrequencyHeatmap: {
            date: string;
            orders: number;
        }[];
        preferredContact: string;
        recommendedMessage: string;
        birthday: string | null;
    }>;
    findById(id: string): Promise<{
        loyaltyPoints: number;
        totalDiscount: number;
        acquisitionSource: import("@prisma/client").$Enums.AcquisitionSource | null;
        acquisitionExecutive: string | null;
        orders: ({
            items: {
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
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
            raffleAccessCode: string | null;
            status: import("@prisma/client").$Enums.OrderStatus;
            paymentLabel: string | null;
            receiptUrl: string | null;
            promotionId: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
            foodCost: import("@prisma/client/runtime/library").Decimal;
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
        totalSpend: import("@prisma/client/runtime/library").Decimal;
        visitCount: number;
    } | null>;
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
        totalSpend: import("@prisma/client/runtime/library").Decimal;
        visitCount: number;
    }>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    sendSms(dto: SendSmsDto): Promise<{
        sent: number;
        failed: number;
        noPhone: string[];
    }>;
}
