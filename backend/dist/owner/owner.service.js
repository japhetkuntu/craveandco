"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const inventory_service_1 = require("../inventory/inventory.service");
let OwnerService = class OwnerService {
    prisma;
    inventory;
    constructor(prisma, inventory) {
        this.prisma = prisma;
        this.inventory = inventory;
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
    async getDashboard(branchId, from, to, date, categoryIds) {
        const { start: targetDate, end: nextDate } = this.parseRange(from, to, date);
        const [sales, expenses, purchaseOrderItems, stockResult, openAlerts, pendingApprovals, ordersWithItems] = await Promise.all([
            this.prisma.order.aggregate({
                where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: { not: client_1.OrderStatus.CANCELLED } },
                _sum: { total: true, foodCost: true },
                _count: true,
            }),
            this.prisma.expense.aggregate({
                where: { branchId, paidAt: { gte: targetDate, lt: nextDate }, approved: true },
                _sum: { amount: true },
            }),
            this.prisma.purchaseOrderItem.findMany({
                where: {
                    purchaseOrder: {
                        branchId,
                        receivedAt: { gte: targetDate, lt: nextDate },
                        status: { in: [client_1.PurchaseOrderStatus.RECEIVED, client_1.PurchaseOrderStatus.PARTIALLY_RECEIVED] },
                    },
                },
                select: { receivedQty: true, unitCost: true },
            }),
            this.inventory.getStock(branchId),
            this.prisma.alert.count({
                where: { branchId, status: 'OPEN' },
            }),
            this.prisma.expense.count({
                where: { branchId, approved: null },
            }),
            this.prisma.order.findMany({
                where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: { not: client_1.OrderStatus.CANCELLED } },
                include: { items: { select: { quantity: true, unitPrice: true } } },
            }),
        ]);
        const totalSales = Number(sales._sum?.total || 0);
        const totalFoodCost = Number(sales._sum?.foodCost || 0);
        const purchaseOrderExpense = purchaseOrderItems.reduce((sum, item) => sum + Number(item.receivedQty) * Number(item.unitCost), 0);
        const operatingExpenses = Number(expenses._sum?.amount || 0);
        const totalExpenses = operatingExpenses + purchaseOrderExpense;
        const lowStock = stockResult.lowStockCount;
        const totalDiscounts = ordersWithItems.reduce((sum, order) => {
            const subtotal = order.items.reduce((itemSum, item) => itemSum + Number(item.unitPrice) * item.quantity, 0);
            return sum + Math.max(subtotal - Number(order.total), 0);
        }, 0);
        const inventoryAssetValue = Number(stockResult.totalAssetValue || 0);
        const inventoryItemCount = Number(stockResult.totalCount || 0);
        const trendMap = {};
        for (const order of ordersWithItems) {
            const date = order.createdAt.toISOString().slice(0, 10);
            if (!trendMap[date]) {
                trendMap[date] = { orders: 0, revenue: 0, visits: 0 };
            }
            trendMap[date].orders += 1;
            trendMap[date].revenue += Number(order.total);
            if (order.customerId)
                trendMap[date].visits += 1;
        }
        const orderSeries = [];
        for (const date = new Date(targetDate); date < nextDate; date.setDate(date.getDate() + 1)) {
            const key = date.toISOString().slice(0, 10);
            const bucket = trendMap[key] || { orders: 0, revenue: 0, visits: 0 };
            orderSeries.push({ date: key, ...bucket });
        }
        const [customerOrdersToday, customerRevenueToday] = await Promise.all([
            this.prisma.order.count({
                where: {
                    branchId,
                    createdAt: { gte: targetDate, lt: nextDate },
                    status: { not: client_1.OrderStatus.CANCELLED },
                    customerId: { not: null },
                },
            }),
            this.prisma.order.aggregate({
                where: {
                    branchId,
                    createdAt: { gte: targetDate, lt: nextDate },
                    status: { not: client_1.OrderStatus.CANCELLED },
                    customerId: { not: null },
                },
                _sum: { total: true },
            }),
        ]);
        const grossProfit = totalSales - totalFoodCost;
        const grossEstimate = totalSales - totalFoodCost - totalExpenses;
        let filteredSales = null;
        let filteredOrderCount = null;
        let filteredAvgTicket = null;
        if (categoryIds?.length) {
            const filteredItems = await this.prisma.orderItem.findMany({
                where: {
                    order: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: { not: client_1.OrderStatus.CANCELLED } },
                    menuItem: { categoryId: { in: categoryIds } },
                },
                select: { orderId: true, unitPrice: true, quantity: true },
            });
            filteredSales = Math.round(filteredItems.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0) * 100) / 100;
            filteredOrderCount = new Set(filteredItems.map((i) => i.orderId)).size;
            filteredAvgTicket = filteredOrderCount > 0 ? Math.round((filteredSales / filteredOrderCount) * 100) / 100 : 0;
        }
        const customerRevenue = Number(customerRevenueToday._sum?.total || 0);
        const ordersWithoutCustomer = sales._count - customerOrdersToday;
        return {
            date,
            salesToday: totalSales,
            ordersToday: sales._count,
            averageTicket: sales._count > 0 ? Math.round((totalSales / sales._count) * 100) / 100 : 0,
            expensesToday: totalExpenses,
            foodCostToday: Math.round(totalFoodCost * 100) / 100,
            grossProfit: Math.round(grossProfit * 100) / 100,
            netProfit: Math.round(grossEstimate * 100) / 100,
            filteredSales,
            filteredOrderCount,
            filteredAvgTicket,
            grossEstimate,
            grossMarginPercent: totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0,
            netMarginPercent: totalSales > 0 ? Math.round((grossEstimate / totalSales) * 100) : 0,
            expenseRatioPercent: totalSales > 0 ? Math.round((totalExpenses / totalSales) * 100) : 0,
            profitPerOrder: sales._count > 0 ? Math.round((grossEstimate / sales._count) * 100) / 100 : 0,
            expensePerOrder: sales._count > 0 ? Math.round((totalExpenses / sales._count) * 100) / 100 : 0,
            customerOrdersToday,
            customerRevenueToday: customerRevenue,
            customerRevenueSharePercent: totalSales > 0 ? Math.round((customerRevenue / totalSales) * 100) : 0,
            customerOrderRatePercent: sales._count > 0 ? Math.round((customerOrdersToday / sales._count) * 100) : 0,
            ordersWithoutCustomer,
            discountsGiven: Number(totalDiscounts.toFixed(2)),
            lowStockAlerts: lowStock,
            inventoryAssetValue,
            inventoryItemCount,
            openAlerts,
            pendingApprovals,
            orderSeries,
        };
    }
    async getPendingApprovals(branchId, page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.expense.findMany({
            where: { branchId, approved: null, category: { not: 'Purchase Request' } },
            include: { user: { select: { id: true, name: true } } },
            orderBy: { paidAt: 'desc' },
            take,
            skip,
        });
    }
    async approveItem(id, approved) {
        return this.prisma.expense.update({
            where: { id },
            data: { approved },
        });
    }
    async listStaff(branchId, page = 0, limit = 10, includeInactive = false) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        const where = { branchId };
        if (!includeInactive) {
            where.active = true;
        }
        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                active: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
    async createStaff(branchId, dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.BadRequestException('A user with that email already exists.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 12);
        return this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                passwordHash,
                role: dto.role,
                branchId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                active: true,
                createdAt: true,
            },
        });
    }
    async updateStaff(id, branchId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user || user.branchId !== branchId) {
            throw new common_1.ForbiddenException('Staff member not found in your branch.');
        }
        if (user.role === client_1.Role.OWNER) {
            throw new common_1.ForbiddenException('Cannot modify another owner.');
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                name: dto.name ?? user.name,
                email: dto.email ?? user.email,
                phone: dto.phone ?? user.phone,
                role: dto.role ?? user.role,
                active: dto.active ?? user.active,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                active: true,
                createdAt: true,
            },
        });
    }
    async deactivateStaff(id, branchId) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user || user.branchId !== branchId) {
            throw new common_1.ForbiddenException('Staff member not found in your branch.');
        }
        if (user.role === client_1.Role.OWNER) {
            throw new common_1.ForbiddenException('Cannot deactivate an owner.');
        }
        return this.prisma.user.update({
            where: { id },
            data: { active: false },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                active: true,
                createdAt: true,
            },
        });
    }
    async getOpenAlerts(branchId, page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.alert.findMany({
            where: { branchId, status: 'OPEN' },
            orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
            take,
            skip,
        });
    }
    async listPaymentTypes(branchId, page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.paymentType.findMany({
            where: { branchId },
            orderBy: { createdAt: 'asc' },
            take,
            skip,
        });
    }
    async createPaymentType(branchId, dto) {
        return this.prisma.paymentType.create({
            data: { branchId, name: dto.name, method: dto.method },
        });
    }
    async updatePaymentType(id, dto) {
        return this.prisma.paymentType.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.method !== undefined && { method: dto.method }),
                ...(dto.active !== undefined && { active: dto.active }),
            },
        });
    }
    async deletePaymentType(id) {
        return this.prisma.paymentType.delete({ where: { id } });
    }
};
exports.OwnerService = OwnerService;
exports.OwnerService = OwnerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, inventory_service_1.InventoryService])
], OwnerService);
//# sourceMappingURL=owner.service.js.map