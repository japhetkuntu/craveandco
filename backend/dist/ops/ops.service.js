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
exports.OpsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let OpsService = class OpsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    parseRange(from, to, date) {
        if (from && to) {
            const start = new Date(from);
            const end = new Date(to);
            end.setHours(0, 0, 0, 0);
            end.setDate(end.getDate() + 1);
            start.setHours(0, 0, 0, 0);
            return { start, end };
        }
        const targetDate = new Date(date ?? new Date().toISOString().split('T')[0]);
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        return { start: targetDate, end: nextDate };
    }
    parseChecklistHistoryRange(from, to) {
        const end = to ? new Date(to) : new Date();
        end.setHours(0, 0, 0, 0);
        const start = from ? new Date(from) : new Date(end);
        if (!from) {
            start.setDate(end.getDate() - 6);
        }
        start.setHours(0, 0, 0, 0);
        const nextDate = new Date(end);
        nextDate.setDate(nextDate.getDate() + 1);
        return { start, end: nextDate };
    }
    getChecklistStats(lists = {}) {
        let completed = 0;
        let total = 0;
        Object.values(lists).forEach((items) => {
            if (!Array.isArray(items))
                return;
            items.forEach((item) => {
                if (item && typeof item === 'object' && typeof item.checked === 'boolean') {
                    if (item.checked)
                        completed += 1;
                    total += 1;
                }
            });
        });
        return {
            completed,
            total,
            completion: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }
    async getCommandCenter(branchId, from, to, date) {
        const { start: targetDate, end: nextDate } = this.parseRange(from, to, date);
        const [activeOrders, completedOrders, openAlerts, customerOrders, customerRevenue, totalRevenue, pendingPurchaseOrders, inventoryMovements, ingredients] = await Promise.all([
            this.prisma.order.count({
                where: { branchId, status: { in: [client_1.OrderStatus.NEW, client_1.OrderStatus.PREPARING, client_1.OrderStatus.READY] } },
            }),
            this.prisma.order.count({
                where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: client_1.OrderStatus.COMPLETED },
            }),
            this.prisma.alert.count({
                where: { branchId, status: 'OPEN' },
            }),
            this.prisma.order.count({
                where: {
                    branchId,
                    createdAt: { gte: targetDate, lt: nextDate },
                    status: { not: client_1.OrderStatus.CANCELLED },
                },
            }),
            this.prisma.order.aggregate({
                where: {
                    branchId,
                    createdAt: { gte: targetDate, lt: nextDate },
                    status: { not: client_1.OrderStatus.CANCELLED },
                },
                _sum: { total: true },
            }),
            this.prisma.order.aggregate({
                where: {
                    branchId,
                    createdAt: { gte: targetDate, lt: nextDate },
                    status: { not: client_1.OrderStatus.CANCELLED },
                },
                _sum: { total: true },
            }),
            this.prisma.purchaseOrder.count({
                where: { branchId, status: { in: [client_1.PurchaseOrderStatus.DRAFT, client_1.PurchaseOrderStatus.SENT, client_1.PurchaseOrderStatus.PARTIALLY_RECEIVED] } },
            }),
            this.prisma.inventoryMovement.groupBy({
                by: ['ingredientId'],
                where: { branchId },
                _sum: { quantity: true },
            }),
            this.prisma.ingredient.findMany({
                select: { id: true, name: true, reorderLevel: true },
            }),
        ]);
        const movementMap = new Map(inventoryMovements.map((m) => [m.ingredientId, Number(m._sum?.quantity ?? 0)]));
        const lowStockItems = ingredients
            .map((ingredient) => {
            const onHand = Number(movementMap.get(ingredient.id) ?? 0);
            return {
                name: ingredient.name,
                onHand,
                reorderLevel: Number(ingredient.reorderLevel),
            };
        })
            .filter((item) => item.onHand < item.reorderLevel);
        const totalOrders = await this.prisma.order.count({
            where: {
                branchId,
                createdAt: { gte: targetDate, lt: nextDate },
                status: { not: client_1.OrderStatus.CANCELLED },
            },
        });
        const avgOrderValue = totalOrders > 0 ? Math.round((Number(totalRevenue._sum?.total || 0) / totalOrders) * 100) / 100 : 0;
        const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
        const actionItems = [];
        if (openAlerts > 0)
            actionItems.push(`Resolve ${openAlerts} open alerts`);
        if (lowStockItems.length > 0)
            actionItems.push(`Review ${lowStockItems.length} low stock items`);
        if (activeOrders > 0)
            actionItems.push(`Complete ${activeOrders} active orders`);
        if (pendingPurchaseOrders > 0)
            actionItems.push(`Process ${pendingPurchaseOrders} purchase orders`);
        return {
            date: from && to ? `${from} to ${to}` : date,
            activeOrders,
            completedOrders,
            totalOrders,
            lowStockCount: lowStockItems.length,
            staffOnDuty: await this.prisma.attendanceLog.count({
                where: { branchId, clockIn: { gte: targetDate, lt: nextDate }, clockOut: null },
            }),
            openAlerts,
            customerOrders,
            customerRevenue: Number(customerRevenue._sum?.total || 0),
            pendingPurchaseOrders,
            avgOrderValue,
            completionRate,
            lowStockPreview: lowStockItems.slice(0, 5),
            actionItems,
        };
    }
    async getServiceTimeline(branchId, from, to, date, page = 0, limit = 50) {
        const { start: targetDate, end: nextDate } = this.parseRange(from, to, date);
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.order.findMany({
            where: { branchId, createdAt: { gte: targetDate, lt: nextDate } },
            select: { id: true, channel: true, status: true, total: true, createdAt: true, updatedAt: true },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
    async dayClose(branchId, closedBy) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const sales = await this.prisma.order.aggregate({
            where: { branchId, createdAt: { gte: today, lt: tomorrow }, status: { not: client_1.OrderStatus.CANCELLED } },
            _sum: { total: true },
            _count: true,
        });
        const expenses = await this.prisma.expense.aggregate({
            where: { branchId, paidAt: { gte: today, lt: tomorrow }, approved: true },
            _sum: { amount: true },
        });
        const record = await this.prisma.auditLog.create({
            data: {
                userId: closedBy,
                branchId,
                action: 'DAY_CLOSE',
                module: 'OPS',
                details: {
                    date: today.toISOString().split('T')[0],
                    totalSales: Number(sales._sum?.total || 0),
                    orderCount: sales._count,
                    totalExpenses: Number(expenses._sum?.amount || 0),
                },
            },
        });
        return {
            date: today.toISOString().split('T')[0],
            totalSales: Number(sales._sum?.total || 0),
            orderCount: sales._count,
            totalExpenses: Number(expenses._sum?.amount || 0),
            closedBy,
            closedAt: new Date(),
            auditId: record.id,
        };
    }
    async getDayCloseSummary(branchId, date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const record = await this.prisma.auditLog.findFirst({
            where: {
                branchId,
                module: 'OPS',
                action: 'DAY_CLOSE',
                createdAt: { gte: targetDate, lt: nextDate },
            },
            orderBy: { createdAt: 'desc' },
        });
        const sales = await this.prisma.order.aggregate({
            where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: { not: client_1.OrderStatus.CANCELLED } },
            _sum: { total: true },
            _count: true,
        });
        const expenses = await this.prisma.expense.aggregate({
            where: { branchId, paidAt: { gte: targetDate, lt: nextDate }, approved: true },
            _sum: { amount: true },
        });
        return {
            date: date,
            totalSales: Number(sales._sum?.total || 0),
            orderCount: sales._count,
            totalExpenses: Number(expenses._sum?.amount || 0),
            closed: Boolean(record),
            closedAt: record?.createdAt || null,
            closedBy: record?.userId || null,
            auditId: record?.id || null,
        };
    }
    async getChecklists(branchId, date, userId) {
        const targetDate = new Date(date);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const record = await this.prisma.auditLog.findFirst({
            where: {
                branchId,
                module: 'CHECKLIST',
                action: 'SAVE',
                createdAt: { gte: targetDate, lt: nextDate },
                ...(userId ? { userId } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
        return record?.details || null;
    }
    async getChecklistHistory(branchId, userId, from, to) {
        const { start, end } = this.parseChecklistHistoryRange(from, to);
        const records = await this.prisma.auditLog.findMany({
            where: {
                branchId,
                module: 'CHECKLIST',
                action: 'SAVE',
                createdAt: { gte: start, lt: end },
                ...(userId ? { userId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true, role: true } } },
        });
        const uniqueRecordsByUserDate = new Map();
        records.forEach((record) => {
            const details = record.details || {};
            const recordDate = details.date || record.createdAt.toISOString().split('T')[0];
            const key = `${record.userId}:${recordDate}`;
            if (!uniqueRecordsByUserDate.has(key)) {
                uniqueRecordsByUserDate.set(key, record);
            }
        });
        const dailyMap = new Map();
        const history = Array.from(uniqueRecordsByUserDate.values()).map((record) => {
            const details = record.details || {};
            const lists = details.lists || {};
            const stats = this.getChecklistStats(lists);
            const recordDate = details.date || record.createdAt.toISOString().split('T')[0];
            const existing = dailyMap.get(recordDate) ?? {
                totalCompletion: 0,
                count: 0,
                totalItems: 0,
                completedItems: 0,
            };
            existing.totalCompletion += stats.completion;
            existing.count += 1;
            existing.totalItems += stats.total;
            existing.completedItems += stats.completed;
            dailyMap.set(recordDate, existing);
            return {
                id: record.id,
                date: recordDate,
                savedAt: record.createdAt,
                user: record.user,
                completion: stats.completion,
                totalItems: stats.total,
                completedItems: stats.completed,
                lists,
            };
        });
        const dailySummaries = [];
        const current = new Date(start);
        while (current < end) {
            const dateKey = current.toISOString().split('T')[0];
            const entry = dailyMap.get(dateKey);
            dailySummaries.push({
                date: dateKey,
                checklistCount: entry?.count ?? 0,
                averageCompletion: entry ? Math.round(entry.totalCompletion / entry.count) : 0,
                totalItems: entry?.totalItems ?? 0,
                completedItems: entry?.completedItems ?? 0,
            });
            current.setDate(current.getDate() + 1);
        }
        return {
            history,
            dailySummaries,
            range: {
                from: start.toISOString().split('T')[0],
                to: new Date(end).toISOString().split('T')[0],
            },
        };
    }
    async saveChecklists(branchId, userId, date, lists) {
        const targetDate = new Date(date);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const existing = await this.prisma.auditLog.findFirst({
            where: {
                branchId,
                userId,
                module: 'CHECKLIST',
                action: 'SAVE',
                createdAt: { gte: targetDate, lt: nextDate },
            },
            orderBy: { createdAt: 'desc' },
        });
        const details = JSON.parse(JSON.stringify({ date, lists }));
        if (existing) {
            return this.prisma.auditLog.update({
                where: { id: existing.id },
                data: { details },
            });
        }
        return this.prisma.auditLog.create({
            data: {
                userId,
                branchId,
                action: 'SAVE',
                module: 'CHECKLIST',
                details,
            },
        });
    }
};
exports.OpsService = OpsService;
exports.OpsService = OpsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OpsService);
//# sourceMappingURL=ops.service.js.map