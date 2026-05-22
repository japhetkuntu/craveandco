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
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CustomersService = class CustomersService {
    prisma;
    config;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    parseBirthday(birthday) {
        if (birthday === undefined)
            return undefined;
        if (birthday === null)
            return null;
        const parsed = new Date(birthday);
        if (Number.isNaN(parsed.getTime())) {
            throw new common_1.BadRequestException('Invalid birthday format');
        }
        return parsed;
    }
    async create(dto) {
        const birthday = this.parseBirthday(dto.birthday);
        try {
            return await this.prisma.customer.create({
                data: {
                    name: dto.name,
                    phone: dto.phone,
                    email: dto.email,
                    ...(birthday !== undefined ? { birthday } : {}),
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.BadRequestException('A customer with that phone number already exists.');
            }
            throw error;
        }
    }
    async update(id, dto) {
        const { birthday, ...rest } = dto;
        const parsedBirthday = this.parseBirthday(birthday);
        try {
            return await this.prisma.customer.update({
                where: { id },
                data: {
                    ...rest,
                    ...(parsedBirthday !== undefined ? { birthday: parsedBirthday } : {}),
                },
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new common_1.BadRequestException('A customer with that phone number already exists.');
            }
            throw error;
        }
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
            orderBy: { createdAt: 'desc' },
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
    async getUpcomingBirthdays(days = 7) {
        const now = new Date();
        const results = [];
        for (let i = 0; i <= days; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const customers = await this.prisma.$queryRaw `
        SELECT id, name, phone, email, birthday
        FROM customers
        WHERE birthday IS NOT NULL
          AND EXTRACT(MONTH FROM birthday) = ${month}
          AND EXTRACT(DAY FROM birthday) = ${day}
        LIMIT 50
      `;
            for (const c of customers) {
                results.push({ ...c, daysUntil: i });
            }
        }
        return results;
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
    async sendSms(dto) {
        const { customerIds, message } = dto;
        if (!message.trim())
            throw new common_1.BadRequestException('Message cannot be empty');
        if (!customerIds.length)
            throw new common_1.BadRequestException('No customers selected');
        const customers = await this.prisma.customer.findMany({
            where: { id: { in: customerIds } },
            select: { id: true, name: true, phone: true },
        });
        const withPhone = customers.filter((c) => c.phone);
        const noPhone = customers.filter((c) => !c.phone).map((c) => c.name);
        if (withPhone.length === 0) {
            return { sent: 0, failed: 0, noPhone };
        }
        const normalizePhone = (phone) => {
            const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '');
            if (cleaned.startsWith('0'))
                return '233' + cleaned.slice(1);
            if (cleaned.startsWith('233'))
                return cleaned;
            return cleaned;
        };
        const apiKey = this.config.get('ARKESEL_API_KEY');
        const senderId = this.config.get('ARKESEL_SENDER_ID') ?? 'Crave&Co';
        if (!apiKey || apiKey === 'your_arkesel_api_key_here') {
            throw new common_1.InternalServerErrorException('SMS service is not configured. Set ARKESEL_API_KEY in the server environment.');
        }
        const callArkesel = async (to, text) => {
            const url = new URL('https://sms.arkesel.com/sms/api');
            url.searchParams.set('action', 'send-sms');
            url.searchParams.set('api_key', apiKey);
            url.searchParams.set('to', to);
            url.searchParams.set('from', senderId);
            url.searchParams.set('sms', text.trim());
            let raw;
            try {
                const res = await fetch(url.toString());
                raw = await res.text();
            }
            catch {
                throw new common_1.BadRequestException('Could not reach SMS gateway. Check server network connectivity.');
            }
            let data;
            try {
                data = JSON.parse(raw);
            }
            catch {
                throw new common_1.BadRequestException(`Unexpected SMS gateway response: ${raw.slice(0, 120)}`);
            }
            if (data.code !== 'ok') {
                throw new common_1.BadRequestException(data.message ?? `SMS gateway error (code: ${data.code})`);
            }
        };
        if (message.includes('{name}')) {
            let sent = 0;
            for (const c of withPhone) {
                await callArkesel(normalizePhone(c.phone), message.replace(/\{name\}/g, c.name));
                sent++;
            }
            return { sent, failed: 0, noPhone };
        }
        await callArkesel(withPhone.map((c) => normalizePhone(c.phone)).join(','), message);
        return { sent: withPhone.length, failed: 0, noPhone };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map