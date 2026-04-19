export declare class CreateExpenseDto {
    category: string;
    amount: number;
    description?: string;
    receiptUrl?: string;
}
export declare class ReconcileCashDto {
    branchId: string;
    date: string;
    expectedCash: number;
    actualCash: number;
    notes?: string;
}
export declare class ApproveExpenseDto {
    approved: boolean;
}
