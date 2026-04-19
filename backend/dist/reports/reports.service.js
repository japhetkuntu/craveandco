"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard(branchId, date) {
        const targetDate = new Date(date);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const [sales, orderCount, topItems, expenses] = await Promise.all([
            this.prisma.order.aggregate({
                where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: { not: client_1.OrderStatus.CANCELLED } },
                _sum: { total: true },
            }),
            this.prisma.order.count({
                where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: { not: client_1.OrderStatus.CANCELLED } },
            }),
            this.prisma.orderItem.groupBy({
                by: ['menuItemId'],
                where: { order: { branchId, createdAt: { gte: targetDate, lt: nextDate } } },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5,
            }),
            this.prisma.expense.aggregate({
                where: { branchId, paidAt: { gte: targetDate, lt: nextDate }, approved: true },
                _sum: { amount: true },
            }),
        ]);
        const itemIds = topItems.map((i) => i.menuItemId);
        const menuItems = await this.prisma.menuItem.findMany({
            where: { id: { in: itemIds } },
        });
        const totalSales = Number(sales._sum?.total || 0);
        const totalExpenses = Number(expenses._sum?.amount || 0);
        const grossProfit = totalSales - totalExpenses;
        return {
            date,
            totalSales,
            orderCount,
            averageTicket: orderCount > 0 ? Math.round((totalSales / orderCount) * 100) / 100 : 0,
            totalExpenses,
            grossProfit,
            grossMarginPercent: totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0,
            expenseRatioPercent: totalSales > 0 ? Math.round((totalExpenses / totalSales) * 100) : 0,
            topItems: topItems.map((t) => ({
                menuItem: menuItems.find((m) => m.id === t.menuItemId),
                totalQuantity: t._sum?.quantity || 0,
            })),
        };
    }
    async getWeeklyReport(branchId, weekStart) {
        if (!weekStart) {
            throw new common_1.BadRequestException('weekStart is required');
        }
        const start = new Date(weekStart);
        if (Number.isNaN(start.getTime())) {
            throw new common_1.BadRequestException('Invalid weekStart date');
        }
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const orders = await this.prisma.order.findMany({
            where: {
                branchId,
                createdAt: { gte: start, lt: end },
                status: { not: client_1.OrderStatus.CANCELLED },
            },
            select: {
                total: true,
                createdAt: true,
            },
        });
        const expenses = await this.prisma.expense.findMany({
            where: {
                branchId,
                paidAt: { gte: start, lt: end },
                approved: true,
            },
            select: {
                amount: true,
                paidAt: true,
            },
        });
        const ordersMap = new Map();
        orders.forEach((order) => {
            const day = order.createdAt.toISOString().split('T')[0];
            const existing = ordersMap.get(day);
            const total = Number(order.total);
            ordersMap.set(day, {
                totalSales: (existing?.totalSales ?? 0) + total,
                orderCount: (existing?.orderCount ?? 0) + 1,
            });
        });
        const expensesMap = new Map();
        expenses.forEach((expense) => {
            const day = expense.paidAt.toISOString().split('T')[0];
            expensesMap.set(day, (expensesMap.get(day) ?? 0) + Number(expense.amount));
        });
        const days = Array.from({ length: 7 }).map((_, index) => {
            const date = new Date(start);
            date.setDate(date.getDate() + index);
            const dayKey = date.toISOString().split('T')[0];
            const orderRow = ordersMap.get(dayKey);
            const daySales = orderRow?.totalSales ?? 0;
            const dayOrders = orderRow?.orderCount ?? 0;
            const dayExpenses = expensesMap.get(dayKey) ?? 0;
            return {
                date: dayKey,
                totalSales: daySales,
                orderCount: dayOrders,
                totalExpenses: dayExpenses,
                grossProfit: daySales - dayExpenses,
                averageTicket: dayOrders > 0 ? Math.round((daySales / dayOrders) * 100) / 100 : 0,
            };
        });
        const totalSales = days.reduce((sum, day) => sum + day.totalSales, 0);
        const totalOrders = days.reduce((sum, day) => sum + day.orderCount, 0);
        const totalExpenses = days.reduce((sum, day) => sum + day.totalExpenses, 0);
        return {
            weekStart,
            totalSales,
            totalOrders,
            totalExpenses,
            grossProfit: totalSales - totalExpenses,
            days,
        };
    }
    async getSummary(branchId, period, date) {
        if (!period || !date) {
            throw new common_1.BadRequestException('period and date are required');
        }
        const targetDate = new Date(date);
        if (Number.isNaN(targetDate.getTime())) {
            throw new common_1.BadRequestException('Invalid date');
        }
        const { start, end } = this.getRangeForPeriod(period, targetDate);
        const orders = await this.prisma.order.findMany({
            where: {
                branchId,
                createdAt: { gte: start, lt: end },
                status: { not: client_1.OrderStatus.CANCELLED },
            },
            select: {
                total: true,
                createdAt: true,
            },
        });
        const expenses = await this.prisma.expense.findMany({
            where: {
                branchId,
                paidAt: { gte: start, lt: end },
                approved: true,
            },
            select: {
                amount: true,
                paidAt: true,
            },
        });
        const ordersMap = new Map();
        orders.forEach((order) => {
            const key = this.getPeriodKey(order.createdAt, period);
            const existing = ordersMap.get(key);
            const total = Number(order.total);
            ordersMap.set(key, {
                totalSales: (existing?.totalSales ?? 0) + total,
                orderCount: (existing?.orderCount ?? 0) + 1,
            });
        });
        const expensesMap = new Map();
        expenses.forEach((expense) => {
            const key = this.getPeriodKey(expense.paidAt, period);
            expensesMap.set(key, (expensesMap.get(key) ?? 0) + Number(expense.amount));
        });
        const periods = this.buildPeriodKeys(period, start);
        const days = periods.map((periodKey) => {
            const orderRow = ordersMap.get(periodKey);
            const daySales = orderRow?.totalSales ?? 0;
            const dayOrders = orderRow?.orderCount ?? 0;
            const dayExpenses = expensesMap.get(periodKey) ?? 0;
            return {
                date: periodKey,
                totalSales: daySales,
                orderCount: dayOrders,
                totalExpenses: dayExpenses,
                grossProfit: daySales - dayExpenses,
                averageTicket: dayOrders > 0 ? Math.round((daySales / dayOrders) * 100) / 100 : 0,
            };
        });
        const totalSales = days.reduce((sum, day) => sum + day.totalSales, 0);
        const totalOrders = days.reduce((sum, day) => sum + day.orderCount, 0);
        const totalExpenses = days.reduce((sum, day) => sum + day.totalExpenses, 0);
        return {
            periodStart: date,
            period,
            totalSales,
            totalOrders,
            totalExpenses,
            grossProfit: totalSales - totalExpenses,
            days,
        };
    }
    getRangeForPeriod(period, date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        let end = new Date(start);
        switch (period) {
            case 'day':
                end.setDate(end.getDate() + 1);
                break;
            case 'week':
                const day = start.getDay();
                const diff = start.getDate() - day + (day === 0 ? -6 : 1);
                start.setDate(diff);
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(end.getDate() + 7);
                break;
            case 'month':
                start.setDate(1);
                end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
                break;
            case 'year':
                start.setMonth(0, 1);
                end = new Date(start.getFullYear() + 1, 0, 1);
                break;
            default:
                throw new common_1.BadRequestException('Unsupported period');
        }
        return { start, end };
    }
    getPeriodKey(date, period) {
        const d = new Date(date);
        if (period === 'year') {
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        }
        return d.toISOString().split('T')[0];
    }
    buildPeriodKeys(period, start) {
        const keys = [];
        const date = new Date(start);
        if (period === 'year') {
            for (let month = 0; month < 12; month += 1) {
                const keyDate = new Date(start.getFullYear(), month, 1);
                keys.push(keyDate.toISOString().split('T')[0]);
            }
            return keys;
        }
        const length = period === 'month'
            ? new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
            : period === 'week'
                ? 7
                : 1;
        for (let index = 0; index < length; index += 1) {
            const keyDate = new Date(start);
            keyDate.setDate(start.getDate() + index);
            keys.push(keyDate.toISOString().split('T')[0]);
        }
        return keys;
    }
    async getMenuProfitability(branchId, from, to) {
        const items = await this.prisma.menuItem.findMany({
            where: { branchId },
            include: {
                recipeItems: { include: { ingredient: true } },
                orderItems: {
                    where: {
                        order: {
                            createdAt: { gte: new Date(from), lte: new Date(to) },
                            status: { not: client_1.OrderStatus.CANCELLED },
                        },
                    },
                    include: { ingredientCosts: true },
                },
            },
        });
        return items.map((item) => {
            const totalSold = item.orderItems.reduce((s, oi) => s + oi.quantity, 0);
            const totalCost = item.orderItems.reduce((sum, oi) => sum + Number(oi.unitCost) * oi.quantity, 0);
            const ingredientTotals = item.orderItems.reduce((totals, oi) => {
                oi.ingredientCosts?.forEach((cost) => {
                    const key = `${cost.ingredientId}:${cost.ingredientName}`;
                    totals[key] = totals[key] || { ingredientName: cost.ingredientName, totalCost: 0 };
                    totals[key].totalCost += Number(cost.totalCost) * oi.quantity;
                });
                return totals;
            }, {});
            const ingredientBreakdown = Object.values(ingredientTotals)
                .map((breakdown) => ({
                ...breakdown,
                totalCost: Math.round(breakdown.totalCost * 100) / 100,
            }))
                .sort((a, b) => b.totalCost - a.totalCost);
            const foodCostPerUnit = totalSold > 0 ? totalCost / totalSold : 0;
            const revenue = totalSold * Number(item.price);
            return {
                id: item.id,
                name: item.name,
                price: Number(item.price),
                foodCost: Math.round(foodCostPerUnit * 100) / 100,
                marginPercent: Number(item.price) > 0 ? Math.round(((Number(item.price) - foodCostPerUnit) / Number(item.price)) * 100) : 0,
                totalSold,
                revenue,
                totalCost,
                grossProfit: revenue - totalCost,
                ingredientBreakdown,
            };
        });
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map