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
exports.KitchenService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const alerts_service_1 = require("../alerts/alerts.service");
let KitchenService = class KitchenService {
    prisma;
    alerts;
    constructor(prisma, alerts) {
        this.prisma = prisma;
        this.alerts = alerts;
    }
    async getLiveOrders(branchId, station, page = 0, limit = 50) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.order.findMany({
            where: {
                branchId,
                status: { in: [client_1.OrderStatus.NEW, client_1.OrderStatus.PREPARING, client_1.OrderStatus.READY] },
                ...(station && {
                    items: {
                        some: {
                            menuItem: {
                                category: { name: station },
                            },
                        },
                    },
                }),
            },
            include: { items: { include: { menuItem: true } } },
            orderBy: { createdAt: 'asc' },
            take,
            skip,
        });
    }
    isValidOrderStatus(status) {
        return Object.values(client_1.OrderStatus).includes(status);
    }
    async updateOrderStatus(orderId, status) {
        if (!this.isValidOrderStatus(status)) {
            throw new common_1.BadRequestException(`Invalid order status: ${status}`);
        }
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { items: { include: { menuItem: true } } },
        });
    }
    async getPrepList(branchId, date, shift, page = 0, limit = 50) {
        const targetDate = new Date(date);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const orders = await this.prisma.order.findMany({
            where: {
                branchId,
                createdAt: { gte: targetDate, lt: nextDate },
                status: { in: [client_1.OrderStatus.NEW, client_1.OrderStatus.PREPARING] },
            },
            include: { items: { include: { menuItem: true } } },
        });
        const map = {};
        for (const order of orders) {
            for (const item of order.items) {
                const key = item.menuItemId;
                if (!map[key]) {
                    map[key] = { menuItemId: key, menuItem: item.menuItem.name, totalQuantity: 0 };
                }
                map[key].totalQuantity += item.quantity;
            }
        }
        const sorted = Object.values(map).sort((a, b) => b.totalQuantity - a.totalQuantity);
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return sorted.slice(skip, skip + take);
    }
    async createShortageRequest(ingredientId, branchId, reason) {
        const movement = await this.prisma.inventoryMovement.create({
            data: {
                ingredientId,
                branchId,
                type: 'ADJUSTMENT',
                quantity: 0,
                reason: reason || 'Shortage reported from kitchen',
            },
        });
        await this.alerts.createAlert(branchId, 'SHORTAGE_REQUEST', client_1.AlertSeverity.WARNING, reason || `Shortage request created for ingredient ${ingredientId}`);
        return movement;
    }
    async logWaste(ingredientId, branchId, quantity, reason) {
        const normalizedQuantity = Math.abs(Number(quantity));
        if (!normalizedQuantity || Number.isNaN(normalizedQuantity)) {
            throw new common_1.BadRequestException('Waste quantity must be greater than zero');
        }
        return this.prisma.inventoryMovement.create({
            data: {
                ingredientId,
                branchId,
                type: 'WASTE',
                quantity: -normalizedQuantity,
                reason,
            },
        });
    }
    async getWasteLogs(branchId, page = 0, limit = 50) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.inventoryMovement.findMany({
            where: { branchId, type: 'WASTE' },
            include: { ingredient: { select: { id: true, name: true, unit: true } } },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
    async getHandoverNotes(date, shift, page = 0, limit = 50) {
        const targetDate = date ? new Date(date) : new Date();
        targetDate.setHours(0, 0, 0, 0);
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.handoverNote.findMany({
            where: {
                date: targetDate,
                ...(shift && { shift: shift }),
            },
            include: { user: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
    }
    async createHandoverNote(userId, dto) {
        return this.prisma.handoverNote.create({
            data: {
                userId,
                shift: dto.shift,
                date: new Date(),
                content: dto.content,
            },
        });
    }
    async getStationLoad(branchId, page = 0, limit = 50) {
        const orders = await this.prisma.order.findMany({
            where: {
                branchId,
                status: { in: [client_1.OrderStatus.NEW, client_1.OrderStatus.PREPARING] },
            },
            include: { items: { include: { menuItem: { include: { category: true } } } } },
        });
        const stationMap = {};
        for (const order of orders) {
            for (const item of order.items) {
                const station = item.menuItem.category?.name || 'General';
                stationMap[station] = (stationMap[station] || 0) + item.quantity;
            }
        }
        const stations = Object.entries(stationMap)
            .map(([station, count]) => ({ station, count }))
            .sort((a, b) => b.count - a.count);
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return stations.slice(skip, skip + take);
    }
};
exports.KitchenService = KitchenService;
exports.KitchenService = KitchenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, alerts_service_1.AlertsService])
], KitchenService);
//# sourceMappingURL=kitchen.service.js.map