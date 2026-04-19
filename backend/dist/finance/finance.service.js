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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let FinanceService = class FinanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createExpense(userId, branchId, dto) {
        return this.prisma.expense.create({
            data: { ...dto, branchId, paidBy: userId, approved: null },
        });
    }
    async findExpenses(branchId, from, to, page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.expense.findMany({
            where: {
                branchId,
                ...(from && { paidAt: { gte: new Date(from) } }),
                ...(to && { paidAt: { lte: new Date(to) } }),
            },
            include: { user: { select: { id: true, name: true } } },
            orderBy: { paidAt: 'desc' },
            take,
            skip,
        });
    }
    async approveExpense(id, approved) {
        return this.prisma.expense.update({
            where: { id },
            data: { approved },
        });
    }
    async reconcileCash(dto, closedBy) {
        return this.prisma.cashReconciliation.create({
            data: {
                branchId: dto.branchId,
                date: new Date(dto.date),
                expectedCash: dto.expectedCash,
                actualCash: dto.actualCash,
                variance: dto.actualCash - dto.expectedCash,
                notes: dto.notes,
                closedBy,
            },
        });
    }
    async getDailySummary(branchId, date) {
        const targetDate = new Date(date);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const [sales, expenses, purchaseOrderItems, reconciliation] = await Promise.all([
            this.prisma.order.aggregate({
                where: {
                    branchId,
                    createdAt: { gte: targetDate, lt: nextDate },
                    status: { not: 'CANCELLED' },
                },
                _sum: { total: true },
                _count: true,
            }),
            this.prisma.expense.aggregate({
                where: {
                    branchId,
                    paidAt: { gte: targetDate, lt: nextDate },
                    approved: true,
                },
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
            this.prisma.cashReconciliation.findFirst({
                where: { branchId, date: targetDate },
            }),
        ]);
        const purchaseOrderExpense = purchaseOrderItems.reduce((sum, item) => sum + Number(item.receivedQty) * Number(item.unitCost), 0);
        const expenseSum = Number(expenses._sum?.amount || 0) + purchaseOrderExpense;
        return {
            date,
            totalSales: Number(sales._sum?.total || 0),
            orderCount: sales._count,
            totalExpenses: expenseSum,
            netCash: Number(sales._sum?.total || 0) - expenseSum,
            reconciliation,
        };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map