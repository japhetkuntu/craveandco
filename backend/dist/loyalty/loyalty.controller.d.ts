import { LoyaltyService } from './loyalty.service';
import { CreateLoyaltyTxDto } from './dto/loyalty.dto';
export declare class LoyaltyController {
    private loyalty;
    constructor(loyalty: LoyaltyService);
    createTransaction(dto: CreateLoyaltyTxDto): Promise<{
        id: string;
        createdAt: Date;
        customerId: string;
        type: import("@prisma/client").$Enums.LoyaltyTxType;
        points: number;
        reference: string | null;
    }>;
    listTransactions(page?: string, limit?: string): Promise<({
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
    getBalance(customerId: string): Promise<{
        customerId: string;
        balance: number;
    }>;
}
