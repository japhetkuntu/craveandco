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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.customer.create({
            data: { ...dto, birthday: dto.birthday ? new Date(dto.birthday) : undefined },
        });
    }
    async findAll(params) {
        const take = Math.min(Math.max(params?.limit ?? 50, 1), 100);
        const skip = Math.max(params?.page ?? 0, 0) * take;
        const where = {};
        if (params?.lastSeenBefore) {
            where.lastSeenAt = { lt: new Date(params.lastSeenBefore) };
        }
        if (params?.addedAfter || params?.addedBefore) {
            where.createdAt = {
                ...(params.addedAfter && { gte: new Date(params.addedAfter) }),
                ...(params.addedBefore && { lte: new Date(params.addedBefore) }),
            };
        }
        if (params?.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { phone: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
            ];
        }
        const customers = await this.prisma.customer.findMany({
            where,
            orderBy: [{ lastSeenAt: 'desc' }, { createdAt: 'desc' }],
            take,
            skip,
        });
        if (customers.length === 0) {
            return customers;
        }
        const customerStats = await this.prisma.order.groupBy({
            by: ['customerId'],
            where: {
                customerId: { in: customers.map((customer) => customer.id) },
                status: { not: client_1.OrderStatus.CANCELLED },
            },
            _sum: { total: true },
            _count: { _all: true },
        });
        const customerOrders = await this.prisma.order.findMany({
            where: {
                customerId: { in: customers.map((customer) => customer.id) },
                status: { not: client_1.OrderStatus.CANCELLED },
            },
            select: {
                customerId: true,
                total: true,
                items: { select: { quantity: true, unitPrice: true } },
            },
        });
        const loyaltyTransactions = await this.prisma.loyaltyTransaction.findMany({
            where: { customerId: { in: customers.map((customer) => customer.id) } },
            select: { customerId: true, type: true, points: true },
        });
        const statsMap = new Map(customerStats.map((stat) => [
            stat.customerId,
            {
                totalSpend: Number(stat._sum.total || 0),
                visitCount: stat._count._all,
            },
        ]));
        const discountMap = new Map();
        customerOrders.forEach((order) => {
            const subtotal = order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
            const discount = Math.max(subtotal - Number(order.total), 0);
            discountMap.set(order.customerId, (discountMap.get(order.customerId) || 0) + discount);
        });
        const loyaltyPointsMap = new Map();
        loyaltyTransactions.forEach((transaction) => {
            const current = loyaltyPointsMap.get(transaction.customerId) ?? 0;
            loyaltyPointsMap.set(transaction.customerId, current + (transaction.type === client_1.LoyaltyTxType.EARN ? transaction.points : -Math.abs(transaction.points)));
        });
        return customers.map((customer) => ({
            ...customer,
            totalSpend: statsMap.get(customer.id)?.totalSpend ?? Number(customer.totalSpend),
            visitCount: statsMap.get(customer.id)?.visitCount ?? customer.visitCount,
            loyaltyPoints: Math.max(loyaltyPointsMap.get(customer.id) ?? 0, 0),
            totalDiscount: Number((discountMap.get(customer.id) || 0).toFixed(2)),
        }));
    }
    async findById(id) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                orders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: { items: { select: { quantity: true, unitPrice: true } } },
                },
                loyaltyTransactions: { take: 10, orderBy: { createdAt: 'desc' } },
                feedbackTickets: { take: 5, orderBy: { createdAt: 'desc' } },
            },
        });
        if (!customer) {
            return null;
        }
        const balance = customer.loyaltyTransactions.reduce((sum, tx) => sum + (tx.type === client_1.LoyaltyTxType.EARN ? tx.points : -Math.abs(tx.points)), 0);
        const totalDiscount = customer.orders.reduce((sum, order) => {
            const subtotal = order.items.reduce((orderSum, item) => orderSum + Number(item.unitPrice) * item.quantity, 0);
            return sum + Math.max(subtotal - Number(order.total), 0);
        }, 0);
        return {
            ...customer,
            loyaltyPoints: Math.max(balance, 0),
            totalDiscount: Number(totalDiscount.toFixed(2)),
        };
    }
    async getChurnRisk() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return this.prisma.customer.findMany({
            where: {
                visitCount: { gte: 3 },
                lastSeenAt: { lt: thirtyDaysAgo },
            },
            orderBy: { lastSeenAt: 'asc' },
        });
    }
    async getDashboard() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const [total, newThisWeek, activeThisMonth, churnRisk, orderTotals] = await Promise.all([
            this.prisma.customer.count(),
            this.prisma.customer.count({ where: { firstSeenAt: { gte: sevenDaysAgo } } }),
            this.prisma.customer.count({ where: { lastSeenAt: { gte: thirtyDaysAgo } } }),
            this.prisma.customer.count({
                where: { visitCount: { gte: 3 }, lastSeenAt: { lt: thirtyDaysAgo } },
            }),
            this.prisma.order.aggregate({
                where: { customerId: { not: null }, status: { not: client_1.OrderStatus.CANCELLED } },
                _sum: { total: true },
                _count: { _all: true },
            }),
        ]);
        const totalSpend = Number(orderTotals._sum?.total || 0);
        const totalVisits = orderTotals._count._all;
        return {
            total,
            newThisWeek,
            activeThisMonth,
            churnRisk,
            totalSpend,
            averageSpend: total > 0 ? Math.round((totalSpend / total) * 100) / 100 : 0,
            totalVisits,
            averageVisits: total > 0 ? Math.round(totalVisits / total) : 0,
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map