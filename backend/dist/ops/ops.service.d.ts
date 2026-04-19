import { PrismaService } from '../prisma/prisma.service';
export declare class OpsService {
    private prisma;
    constructor(prisma: PrismaService);
    private parseRange;
    private parseChecklistHistoryRange;
    private getChecklistStats;
    getCommandCenter(branchId: string, from?: string, to?: string, date?: string): Promise<{
        date: string | undefined;
        activeOrders: number;
        completedOrders: number;
        totalOrders: number;
        lowStockCount: number;
        staffOnDuty: number;
        openAlerts: number;
        customerOrders: number;
        customerRevenue: number;
        pendingPurchaseOrders: number;
        avgOrderValue: number;
        completionRate: number;
        lowStockPreview: {
            name: string;
            onHand: number;
            reorderLevel: number;
        }[];
        actionItems: string[];
    }>;
    getServiceTimeline(branchId: string, from?: string, to?: string, date?: string, page?: number, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        channel: import("@prisma/client").$Enums.OrderChannel;
        status: import("@prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    dayClose(branchId: string, closedBy: string): Promise<{
        date: string;
        totalSales: number;
        orderCount: number;
        totalExpenses: number;
        closedBy: string;
        closedAt: Date;
        auditId: string;
    }>;
    getDayCloseSummary(branchId: string, date: string): Promise<{
        date: string;
        totalSales: number;
        orderCount: number;
        totalExpenses: number;
        closed: boolean;
        closedAt: Date | null;
        closedBy: string | null;
        auditId: string | null;
    }>;
    getChecklists(branchId: string, date: string, userId?: string): Promise<string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray | null>;
    getChecklistHistory(branchId: string, userId?: string, from?: string, to?: string): Promise<{
        history: {
            id: string;
            date: any;
            savedAt: Date;
            user: {
                name: string;
                role: import("@prisma/client").$Enums.Role;
                id: string;
            };
            completion: number;
            totalItems: number;
            completedItems: number;
            lists: any;
        }[];
        dailySummaries: {
            date: string;
            checklistCount: number;
            averageCompletion: number;
            totalItems: number;
            completedItems: number;
        }[];
        range: {
            from: string;
            to: string;
        };
    }>;
    saveChecklists(branchId: string, userId: string, date: string, lists: Record<string, any>): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        module: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
