import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { CreatePaymentTypeDto, UpdatePaymentTypeDto } from './dto/payment-type.dto';
export declare class OwnerService {
    private prisma;
    private inventory;
    constructor(prisma: PrismaService, inventory: InventoryService);
    private parseRange;
    getDashboard(branchId: string, from?: string, to?: string, date?: string, categoryIds?: string[]): Promise<{
        date: string | undefined;
        salesToday: number;
        ordersToday: number;
        averageTicket: number;
        expensesToday: number;
        grossProfit: number;
        netProfit: number;
        filteredSales: number | null;
        filteredOrderCount: number | null;
        filteredAvgTicket: number | null;
        grossEstimate: number;
        grossMarginPercent: number;
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
    getPendingApprovals(branchId: string, page?: number, limit?: number): Promise<({
        user: {
            name: string;
            id: string;
        };
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        receiptUrl: string | null;
        description: string | null;
        paidAt: Date;
        category: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        approved: boolean | null;
        paidBy: string;
    })[]>;
    approveItem(id: string, approved: boolean): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        receiptUrl: string | null;
        description: string | null;
        paidAt: Date;
        category: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        approved: boolean | null;
        paidBy: string;
    }>;
    listStaff(branchId: string, page?: number, limit?: number, includeInactive?: boolean): Promise<{
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
    getOpenAlerts(branchId: string, page?: number, limit?: number): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.AlertStatus;
        type: string;
        severity: import("@prisma/client").$Enums.AlertSeverity;
        message: string;
    }[]>;
    listPaymentTypes(branchId: string, page?: number, limit?: number): Promise<{
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
