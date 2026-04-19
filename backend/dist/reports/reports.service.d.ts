import { PrismaService } from '../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboard(branchId: string, date: string): Promise<{
        date: string;
        totalSales: number;
        orderCount: number;
        averageTicket: number;
        totalExpenses: number;
        grossProfit: number;
        grossMarginPercent: number;
        expenseRatioPercent: number;
        topItems: {
            menuItem: {
                name: string;
                branchId: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
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
    getSummary(branchId: string, period: 'day' | 'week' | 'month' | 'year', date: string): Promise<{
        periodStart: string;
        period: "year" | "week" | "day" | "month";
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
    private getRangeForPeriod;
    private getPeriodKey;
    private buildPeriodKeys;
    getMenuProfitability(branchId: string, from: string, to: string): Promise<{
        id: string;
        name: string;
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
