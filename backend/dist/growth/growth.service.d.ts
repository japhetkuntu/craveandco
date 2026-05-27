import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
export declare class GrowthService {
    private prisma;
    private customers;
    constructor(prisma: PrismaService, customers: CustomersService);
    private normalizeRange;
    getDashboard(branchId: string, from: string, to: string): Promise<{
        customers: {
            total: number;
            newThisWeek: number;
            activeThisMonth: number;
            churnRisk: number;
            totalSpend: number;
            averageSpend: number;
            totalVisits: number;
            averageVisits: number;
        };
        loyalty: {
            totalPointsIssued: number;
            totalPointsRedeemed: number;
            totalDiscounts: number;
        };
        campaigns: {
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
        }[];
        customerSpend: number;
        customerVisits: number;
        ordersProcessed: number;
        orderSeries: {
            date: string;
            orders: number;
            revenue: number;
            visits: number;
        }[];
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
        totalSpend: import("@prisma/client/runtime/library").Decimal;
        visitCount: number;
    }[]>;
    getPaymentTypes(branchId: string, page?: number, limit?: number): Promise<{
        name: string;
        branchId: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        method: import("@prisma/client").$Enums.PaymentMethod;
    }[]>;
}
