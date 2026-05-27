import { FinanceService } from './finance.service';
import { CreateExpenseDto, ReconcileCashDto, ApproveExpenseDto } from './dto/finance.dto';
export declare class FinanceController {
    private finance;
    constructor(finance: FinanceService);
    createExpense(userId: string, branchId: string, dto: CreateExpenseDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        description: string | null;
        category: string;
        receiptUrl: string | null;
        paidAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        approved: boolean | null;
        paidBy: string;
    }>;
    findExpenses(branchId: string, from?: string, to?: string, page?: string, limit?: string): Promise<({
        user: {
            name: string;
            id: string;
        };
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        description: string | null;
        category: string;
        receiptUrl: string | null;
        paidAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        approved: boolean | null;
        paidBy: string;
    })[]>;
    approveExpense(id: string, dto: ApproveExpenseDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        description: string | null;
        category: string;
        receiptUrl: string | null;
        paidAt: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        approved: boolean | null;
        paidBy: string;
    }>;
    reconcileCash(userId: string, dto: ReconcileCashDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        notes: string | null;
        date: Date;
        variance: import("@prisma/client/runtime/library").Decimal;
        expectedCash: import("@prisma/client/runtime/library").Decimal;
        actualCash: import("@prisma/client/runtime/library").Decimal;
        closedBy: string | null;
    }>;
    getDailySummary(branchId: string, date: string): Promise<{
        date: string;
        totalSales: number;
        orderCount: number;
        totalExpenses: number;
        netCash: number;
        reconciliation: {
            branchId: string;
            id: string;
            createdAt: Date;
            notes: string | null;
            date: Date;
            variance: import("@prisma/client/runtime/library").Decimal;
            expectedCash: import("@prisma/client/runtime/library").Decimal;
            actualCash: import("@prisma/client/runtime/library").Decimal;
            closedBy: string | null;
        } | null;
    }>;
}
