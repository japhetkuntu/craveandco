import { OwnerService } from './owner.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { CreatePaymentTypeDto, UpdatePaymentTypeDto } from './dto/payment-type.dto';
export declare class OwnerController {
    private owner;
    constructor(owner: OwnerService);
    getDashboard(branchId: string, from?: string, to?: string, date?: string, rawCategoryIds?: string | string[]): Promise<{
        date: string | undefined;
        salesToday: number;
        ordersToday: number;
        averageTicket: number;
        expensesToday: number;
        foodCostToday: number;
        grossProfit: number;
        netProfit: number;
        filteredSales: number | null;
        filteredOrderCount: number | null;
        filteredAvgTicket: number | null;
        grossEstimate: number;
        grossMarginPercent: number;
        netMarginPercent: number;
        expenseRatioPercent: number;
        profitPerOrder: number;
        expensePerOrder: number;
        customerOrdersToday: number;
        customerRevenueToday: number;
        customerRevenueSharePercent: number;
        customerOrderRatePercent: number;
        ordersWithoutCustomer: number;
        discountsGiven: number;
        lowStockAlerts: number;
        inventoryAssetValue: number;
        inventoryItemCount: number;
        openAlerts: number;
        pendingApprovals: number;
    }>;
    getPendingApprovals(branchId: string, page?: string, limit?: string): Promise<({
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
    approve(id: string): Promise<{
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
    reject(id: string): Promise<{
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
    getAlerts(branchId: string, page?: string, limit?: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AlertStatus;
        type: string;
        message: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
    }[]>;
    listStaff(branchId: string, showInactive?: string, page?: string, limit?: string): Promise<{
        email: string;
        name: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        active: boolean;
        createdAt: Date;
    }[]>;
    createStaff(branchId: string, dto: CreateStaffDto): Promise<{
        email: string;
        name: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        active: boolean;
        createdAt: Date;
    }>;
    updateStaff(id: string, branchId: string, dto: UpdateStaffDto): Promise<{
        email: string;
        name: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        active: boolean;
        createdAt: Date;
    }>;
    deactivateStaff(id: string, branchId: string): Promise<{
        email: string;
        name: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.Role;
        id: string;
        active: boolean;
        createdAt: Date;
    }>;
    listPaymentTypes(branchId: string, page?: string, limit?: string): Promise<{
        name: string;
        branchId: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        method: import("@prisma/client").$Enums.PaymentMethod;
    }[]>;
    createPaymentType(branchId: string, dto: CreatePaymentTypeDto): Promise<{
        name: string;
        branchId: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        method: import("@prisma/client").$Enums.PaymentMethod;
    }>;
    updatePaymentType(id: string, dto: UpdatePaymentTypeDto): Promise<{
        name: string;
        branchId: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        method: import("@prisma/client").$Enums.PaymentMethod;
    }>;
    deletePaymentType(id: string): Promise<{
        name: string;
        branchId: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        method: import("@prisma/client").$Enums.PaymentMethod;
    }>;
}
