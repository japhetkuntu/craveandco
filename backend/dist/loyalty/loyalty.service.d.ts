import { PrismaService } from '../prisma/prisma.service';
import { CreateLoyaltyTxDto } from './dto/loyalty.dto';
export declare class LoyaltyService {
    private prisma;
    constructor(prisma: PrismaService);
    createTransaction(dto: CreateLoyaltyTxDto): Promise<{
        id: string;
        createdAt: Date;
        customerId: string;
        type: import("@prisma/client").$Enums.LoyaltyTxType;
        points: number;
        reference: string | null;
    }>;
    listTransactions(page?: number, limit?: number): Promise<({
        customer: {
            name: string;
            phone: string | null;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        customerId: string;
        type: import("@prisma/client").$Enums.LoyaltyTxType;
        points: number;
        reference: string | null;
    })[]>;
    getSummary(from?: string, to?: string): Promise<{
        totalEarned: number;
        totalRedeemed: number;
        netOutstanding: number;
    }>;
    getCustomerBalance(customerId: string): Promise<{
        customerId: string;
        balance: number;
    }>;
}
