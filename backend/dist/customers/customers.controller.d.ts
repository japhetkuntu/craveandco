import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/customers.dto';
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
    findAll(segment?: string, search?: string, lastSeenBefore?: string, addedAfter?: string, addedBefore?: string, page?: string, limit?: string): Promise<{
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
    findById(id: string): Promise<{
        loyaltyPoints: number;
        totalDiscount: number;
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
            notes: string | null;
            channel: import("@prisma/client").$Enums.OrderChannel;
            paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
            customerId: string | null;
            guestName: string | null;
            status: import("@prisma/client").$Enums.OrderStatus;
            paymentLabel: string | null;
            receiptUrl: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
            foodCost: import("@prisma/client/runtime/library").Decimal;
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
}
