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
exports.LoyaltyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LoyaltyService = class LoyaltyService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTransaction(dto) {
        return this.prisma.loyaltyTransaction.create({
            data: dto,
        });
    }
    async listTransactions(page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.loyaltyTransaction.findMany({
            take,
            skip,
            orderBy: { createdAt: 'desc' },
            include: { customer: { select: { id: true, name: true, phone: true } } },
        });
    }
    async getSummary(from, to) {
        const where = {};
        if (from)
            where.createdAt = { ...where.createdAt, gte: new Date(from) };
        if (to)
            where.createdAt = { ...where.createdAt, lte: new Date(to) };
        const [earned, redeemed] = await Promise.all([
            this.prisma.loyaltyTransaction.aggregate({
                where: { ...where, type: 'EARN' },
                _sum: { points: true },
            }),
            this.prisma.loyaltyTransaction.aggregate({
                where: { ...where, type: 'REDEEM' },
                _sum: { points: true },
            }),
        ]);
        return {
            totalEarned: earned._sum?.points || 0,
            totalRedeemed: redeemed._sum?.points || 0,
            netOutstanding: (earned._sum?.points || 0) - Math.abs(redeemed._sum?.points || 0),
        };
    }
    async getCustomerBalance(customerId) {
        const [earned, redeemed] = await Promise.all([
            this.prisma.loyaltyTransaction.aggregate({
                where: { customerId, type: 'EARN' },
                _sum: { points: true },
            }),
            this.prisma.loyaltyTransaction.aggregate({
                where: { customerId, type: { in: ['REDEEM', 'EXPIRE'] } },
                _sum: { points: true },
            }),
        ]);
        const balance = (earned._sum?.points || 0) - Math.abs(redeemed._sum?.points || 0);
        return { customerId, balance };
    }
};
exports.LoyaltyService = LoyaltyService;
exports.LoyaltyService = LoyaltyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LoyaltyService);
//# sourceMappingURL=loyalty.service.js.map