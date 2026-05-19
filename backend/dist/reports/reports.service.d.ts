import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboard(branchId: string, date?: string, from?: string, to?: string): Promise<{
        date: string | undefined;
        totalSales: number;
        orderCount: number;
        averageTicket: number;
        totalExpenses: number;
        foodCost: number;
        grossProfit: number;
        netProfit: number;
        grossMarginPercent: number;
        netMarginPercent: number;
        expenseRatioPercent: number;
        topItems: {
            menuItemId: string;
            menuItem: {
                name: string;
                branchId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                imageKey: string | null;
                available: boolean;
                dayparts: string[];
                options: import("@prisma/client/runtime/library").JsonValue | null;
            } | undefined;
            totalQuantity: number;
        }[];
    }>;
    getWeeklyReport(branchId: string, weekStart: string): Promise<{
        weekStart: string;
        totalSales: number;
        totalOrders: number;
        totalExpenses: number;
        grossProfit: number;
        days: {
            date: string;
            totalSales: number;
            orderCount: number;
            totalExpenses: number;
            grossProfit: number;
            averageTicket: number;
        }[];
    }>;
    getSummary(branchId: string, period?: 'day' | 'week' | 'month' | 'year' | 'custom', date?: string, from?: string, to?: string): Promise<{
        periodStart: string | undefined;
        period: "year" | "week" | "day" | "month" | "custom";
        totalSales: number;
        totalOrders: number;
        totalExpenses: number;
        totalFoodCost: number;
        grossProfit: number;
        netProfit: number;
        grossMarginPercent: number;
        netMarginPercent: number;
        days: {
            date: string;
            totalSales: number;
            orderCount: number;
            totalExpenses: number;
            totalFoodCost: number;
            grossProfit: number;
            netProfit: number;
            averageTicket: number;
        }[];
    }>;
    private getRangeForPeriod;
    private getPeriodKey;
    private buildPeriodKeys;
    getMenuProfitability(branchId: string, from: string, to: string, categoryIds?: string[]): Promise<{
        id: string;
        name: string;
        categoryId: string;
        categoryName: string;
        price: number;
        foodCost: number;
        marginPercent: number;
        totalSold: number;
        revenue: number;
        totalCost: number;
        grossProfit: number;
        ingredientBreakdown: {
            totalCost: number;
            ingredientName: string;
        }[];
    }[]>;
}
