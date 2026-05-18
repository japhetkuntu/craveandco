import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reports;
    constructor(reports: ReportsService);
    getDashboard(branchId: string, date?: string, from?: string, to?: string): Promise<{
        date: string | undefined;
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
                description: string | null;
                categoryId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
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
    getReportSummary(branchId: string, period?: 'day' | 'week' | 'month' | 'year' | 'custom', date?: string, from?: string, to?: string): Promise<{
        periodStart: string | undefined;
        period: "year" | "week" | "day" | "month" | "custom";
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
    getMenuProfitability(branchId: string, from: string, to: string, rawCategoryIds?: string | string[]): Promise<{
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
