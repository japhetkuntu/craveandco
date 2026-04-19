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
exports.GrowthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const customers_service_1 = require("../customers/customers.service");
const client_1 = require("@prisma/client");
let GrowthService = class GrowthService {
    prisma;
    customers;
    constructor(prisma, customers) {
        this.prisma = prisma;
        this.customers = customers;
    }
    normalizeRange(from, to) {
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(to);
        end.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 1);
        return { start, end };
    }
    async getDashboard(from, to) {
        const customerDashboard = await this.customers.getDashboard();
        const { start, end } = this.normalizeRange(from, to);
        const campaigns = await this.prisma.campaign.findMany({
            where: { launchedAt: { gte: start, lt: end } },
            orderBy: { launchedAt: 'desc' },
            take: 5,
        });
        const dateFilter = { createdAt: { gte: start, lt: end } };
        const [earned, redeemed, customerSpend, customerVisits, ordersProcessed, ordersWithItems] = await Promise.all([
            this.prisma.loyaltyTransaction.aggregate({
                where: { ...dateFilter, type: 'EARN' },
                _sum: { points: true },
            }),
            this.prisma.loyaltyTransaction.aggregate({
                where: { ...dateFilter, type: 'REDEEM' },
                _sum: { points: true },
            }),
            this.prisma.order.aggregate({
                where: { ...dateFilter, customerId: { not: null }, status: { not: client_1.OrderStatus.CANCELLED } },
                _sum: { total: true },
            }),
            this.prisma.order.count({
                where: { ...dateFilter, customerId: { not: null }, status: { not: client_1.OrderStatus.CANCELLED } },
            }),
            this.prisma.order.count({
                where: { ...dateFilter, status: { not: client_1.OrderStatus.CANCELLED } },
            }),
            this.prisma.order.findMany({
                where: { ...dateFilter, status: { not: client_1.OrderStatus.CANCELLED } },
                include: { items: { select: { quantity: true, unitPrice: true } } },
            }),
        ]);
        const totalDiscounts = ordersWithItems.reduce((sum, order) => {
            const subtotal = order.items.reduce((itemSum, item) => itemSum + Number(item.unitPrice) * item.quantity, 0);
            return sum + Math.max(subtotal - Number(order.total), 0);
        }, 0);
        return {
            customers: customerDashboard,
            loyalty: {
                totalPointsIssued: earned._sum?.points || 0,
                totalPointsRedeemed: Math.abs(redeemed._sum?.points || 0),
                totalDiscounts,
            },
            campaigns,
            customerSpend: Number(customerSpend._sum?.total || 0),
            customerVisits,
            ordersProcessed,
        };
    }
    async getChurnRisk() {
        return this.customers.getChurnRisk();
    }
    async getPaymentTypes(branchId, page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.paymentType.findMany({
            where: { branchId, active: true },
            orderBy: { createdAt: 'asc' },
            take,
            skip,
        });
    }
};
exports.GrowthService = GrowthService;
exports.GrowthService = GrowthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        customers_service_1.CustomersService])
], GrowthService);
//# sourceMappingURL=growth.service.js.map