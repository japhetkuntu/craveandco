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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const promotions_service_1 = require("../promotions/promotions.service");
let OrdersService = class OrdersService {
    prisma;
    promotions;
    constructor(prisma, promotions) {
        this.prisma = prisma;
        this.promotions = promotions;
    }
    orderInclude = {
        items: {
            include: {
                menuItem: { include: { category: true } },
                ingredientCosts: true,
            },
        },
        customer: true,
    };
    async loadMenuItemsWithCosts(menuItemIds) {
        const menuItems = await this.prisma.menuItem.findMany({
            where: { id: { in: menuItemIds } },
            include: { recipeItems: { include: { ingredient: true } } },
        });
        const menuItemsMap = new Map(menuItems.map((m) => [m.id, m]));
        const ingredientCostsMap = new Map(menuItems.map((m) => [
            m.id,
            m.recipeItems.map((ri) => ({
                ingredientId: ri.ingredientId,
                ingredientName: ri.ingredient.name,
                ingredientUnit: ri.unit || ri.ingredient.unit,
                quantity: Number(ri.quantity),
                unitCost: Number(ri.ingredient.currentCost),
                totalCost: Number(ri.quantity) * Number(ri.ingredient.currentCost),
            })),
        ]));
        const costMap = new Map(menuItems.map((m) => [
            m.id,
            (ingredientCostsMap.get(m.id) || []).reduce((sum, cost) => sum + cost.totalCost, 0),
        ]));
        return { menuItemsMap, ingredientCostsMap, costMap };
    }
    getSelectedOptionAdjustment(menuItem, selectedOptions) {
        if (!menuItem?.options || !Array.isArray(selectedOptions))
            return 0;
        const optionMap = new Map((menuItem.options || []).map((opt) => [opt.id, opt]));
        return selectedOptions.reduce((sum, selected) => {
            const option = optionMap.get(selected.optionId);
            if (!option || !Array.isArray(option.values) || !Array.isArray(selected.values))
                return sum;
            const valueMap = new Map((option.values || []).map((value) => [value.id, value]));
            return sum + selected.values.reduce((valueSum, valueId) => {
                const value = valueMap.get(valueId);
                return valueSum + (Number(value?.priceAdjustment || 0));
            }, 0);
        }, 0);
    }
    calculateMenuItemPrice(menuItem, selectedOptions) {
        const basePrice = Number(menuItem?.price || 0);
        return Number((basePrice + this.getSelectedOptionAdjustment(menuItem, selectedOptions)).toFixed(2));
    }
    normalizeSelectedOptions(menuItem, selectedOptions) {
        if (!Array.isArray(selectedOptions) || !menuItem?.options)
            return selectedOptions;
        const optionMap = new Map((menuItem.options || []).map((opt) => [opt.id, opt]));
        return selectedOptions.map((selected) => {
            const option = optionMap.get(selected.optionId);
            const valueMap = new Map((option?.values || []).map((value) => [value.id, value]));
            const labels = (selected.values || []).map((valueId) => valueMap.get(valueId)?.label || valueId);
            return {
                optionId: selected.optionId,
                optionName: option?.name,
                values: selected.values,
                labels,
            };
        });
    }
    calculateTotals(items, menuItemsMap, costMap) {
        const total = items.reduce((sum, item) => {
            const menuItem = menuItemsMap.get(item.menuItemId);
            const unitPrice = this.calculateMenuItemPrice(menuItem, item.selectedOptions);
            return sum + unitPrice * item.quantity;
        }, 0);
        const foodCost = items.reduce((sum, item) => sum + (costMap.get(item.menuItemId) || 0) * item.quantity, 0);
        return { total, foodCost };
    }
    async create(dto) {
        const { menuItemsMap, ingredientCostsMap, costMap } = await this.loadMenuItemsWithCosts(dto.items.map((i) => i.menuItemId));
        const { total, foodCost } = this.calculateTotals(dto.items, menuItemsMap, costMap);
        return this.prisma.order.create({
            data: {
                branchId: dto.branchId,
                channel: dto.channel,
                paymentMethod: dto.paymentMethod,
                customerId: dto.customerId,
                guestName: dto.guestName,
                notes: dto.notes,
                total,
                foodCost,
                items: {
                    create: dto.items.map((item) => {
                        const menuItem = menuItemsMap.get(item.menuItemId);
                        return {
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            unitPrice: this.calculateMenuItemPrice(menuItem, item.selectedOptions),
                            unitCost: costMap.get(item.menuItemId) || 0,
                            notes: item.notes,
                            selectedOptions: this.normalizeSelectedOptions(menuItem, item.selectedOptions),
                            ingredientCosts: {
                                create: (ingredientCostsMap.get(item.menuItemId) || []).map((cost) => ({
                                    ingredientId: cost.ingredientId,
                                    ingredientName: cost.ingredientName,
                                    ingredientUnit: cost.ingredientUnit,
                                    quantity: cost.quantity,
                                    unitCost: cost.unitCost,
                                    totalCost: cost.totalCost,
                                })),
                            },
                        };
                    }),
                },
            },
            include: this.orderInclude,
        });
    }
    enrichOrder(order) {
        const subtotal = order.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
        const discountAmount = Math.max(subtotal - Number(order.total), 0);
        return { ...order, subtotal, discountAmount };
    }
    async findOne(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: this.orderInclude,
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.enrichOrder(order);
    }
    async updateStatus(id, dto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
            include: this.orderInclude,
        });
    }
    async updateItems(id, dto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== client_1.OrderStatus.NEW) {
            throw new common_1.BadRequestException('Can only update items on NEW orders');
        }
        const { menuItemsMap, ingredientCostsMap, costMap } = await this.loadMenuItemsWithCosts(dto.items.map((i) => i.menuItemId));
        const { total, foodCost } = this.calculateTotals(dto.items, menuItemsMap, costMap);
        await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
        return this.prisma.order.update({
            where: { id },
            data: {
                total,
                foodCost,
                items: {
                    create: dto.items.map((item) => {
                        const menuItem = menuItemsMap.get(item.menuItemId);
                        return {
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            unitPrice: this.calculateMenuItemPrice(menuItem, item.selectedOptions),
                            unitCost: costMap.get(item.menuItemId) || 0,
                            notes: item.notes,
                            selectedOptions: this.normalizeSelectedOptions(menuItem, item.selectedOptions),
                            ingredientCosts: {
                                create: (ingredientCostsMap.get(item.menuItemId) || []).map((cost) => ({
                                    ingredientId: cost.ingredientId,
                                    ingredientName: cost.ingredientName,
                                    ingredientUnit: cost.ingredientUnit,
                                    quantity: cost.quantity,
                                    unitCost: cost.unitCost,
                                    totalCost: cost.totalCost,
                                })),
                            },
                        };
                    }),
                },
            },
            include: this.orderInclude,
        });
    }
    async addItem(id, dto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== client_1.OrderStatus.NEW) {
            throw new common_1.BadRequestException('Can only add items to NEW orders');
        }
        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: dto.menuItemId },
            include: { recipeItems: { include: { ingredient: true } } },
        });
        if (!menuItem)
            throw new common_1.NotFoundException('Menu item not found');
        const unitCost = menuItem.recipeItems.reduce((sum, ri) => sum + Number(ri.quantity) * Number(ri.ingredient.currentCost), 0);
        const unitPrice = this.calculateMenuItemPrice(menuItem, dto.selectedOptions);
        await this.prisma.orderItem.create({
            data: {
                orderId: id,
                menuItemId: dto.menuItemId,
                quantity: dto.quantity,
                unitPrice,
                unitCost,
                notes: dto.notes,
                selectedOptions: this.normalizeSelectedOptions(menuItem, dto.selectedOptions),
                ingredientCosts: {
                    create: menuItem.recipeItems.map((ri) => ({
                        ingredientId: ri.ingredientId,
                        ingredientName: ri.ingredient.name,
                        ingredientUnit: ri.unit || ri.ingredient.unit,
                        quantity: Number(ri.quantity),
                        unitCost: Number(ri.ingredient.currentCost),
                        totalCost: Number(ri.quantity) * Number(ri.ingredient.currentCost),
                    })),
                },
            },
        });
        const items = await this.prisma.orderItem.findMany({ where: { orderId: id } });
        const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
        const foodCost = items.reduce((sum, item) => sum + Number(item.unitCost) * item.quantity, 0);
        return this.prisma.order.update({
            where: { id },
            data: { total, foodCost },
            include: this.orderInclude,
        });
    }
    async removeItem(orderId, itemId) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== client_1.OrderStatus.NEW) {
            throw new common_1.BadRequestException('Can only remove items from NEW orders');
        }
        await this.prisma.orderItem.delete({ where: { id: itemId } });
        const items = await this.prisma.orderItem.findMany({ where: { orderId } });
        const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
        const foodCost = items.reduce((sum, item) => sum + Number(item.unitCost) * item.quantity, 0);
        return this.prisma.order.update({
            where: { id: orderId },
            data: { total, foodCost },
            include: this.orderInclude,
        });
    }
    async pay(id, dto) {
        let order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status === client_1.OrderStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot pay a cancelled order');
        }
        if (order.paidAt) {
            throw new common_1.BadRequestException('Order already paid');
        }
        const customerId = dto.customerId || order.customerId;
        if (dto.customerId && !order.customerId) {
            order = await this.prisma.order.update({
                where: { id },
                data: { customerId: dto.customerId },
            });
        }
        let paidTotal = Number(order.total);
        const loyaltyTransactions = [];
        let appliedPromotionId;
        if (dto.promotionId) {
            const promotion = await this.promotions.findById(dto.promotionId);
            if (!promotion)
                throw new common_1.BadRequestException('Promotion not found');
            if (promotion.status !== 'ACTIVE')
                throw new common_1.BadRequestException('Promotion is not active');
            const now = new Date();
            if (promotion.startDate && promotion.startDate > now) {
                throw new common_1.BadRequestException('Promotion has not started yet');
            }
            if (promotion.endDate && promotion.endDate < now) {
                throw new common_1.BadRequestException('Promotion has expired');
            }
            if (promotion.minOrderAmount && paidTotal < Number(promotion.minOrderAmount)) {
                throw new common_1.BadRequestException(`Order total must be at least ${promotion.minOrderAmount} to apply this promotion`);
            }
            const { discountAmount, finalTotal } = this.promotions.calculateDiscount(dto.promotionId, paidTotal, promotion);
            paidTotal = finalTotal;
            appliedPromotionId = dto.promotionId;
        }
        const redeemPoints = dto.redeemPoints === 100 ? 100 : 0;
        if (dto.redeemPoints && dto.redeemPoints !== 100) {
            throw new common_1.BadRequestException('Redeem points must be exactly 100 for a 5% discount');
        }
        if (redeemPoints > 0) {
            if (!customerId) {
                throw new common_1.BadRequestException('Customer must be assigned to redeem loyalty points');
            }
            const [earned, redeemed] = await Promise.all([
                this.prisma.loyaltyTransaction.aggregate({
                    where: { customerId, type: client_1.LoyaltyTxType.EARN },
                    _sum: { points: true },
                }),
                this.prisma.loyaltyTransaction.aggregate({
                    where: { customerId, type: { in: [client_1.LoyaltyTxType.REDEEM, client_1.LoyaltyTxType.EXPIRE] } },
                    _sum: { points: true },
                }),
            ]);
            const earnedPoints = Number(earned._sum?.points || 0);
            const redeemedPoints = Math.abs(Number(redeemed._sum?.points || 0));
            const balance = earnedPoints - redeemedPoints;
            if (balance < redeemPoints) {
                throw new common_1.BadRequestException('Insufficient loyalty points to redeem');
            }
            const discountFactor = 0.05;
            const discountAmount = Number((paidTotal * discountFactor).toFixed(2));
            paidTotal = Number((paidTotal - discountAmount).toFixed(2));
            loyaltyTransactions.push(this.prisma.loyaltyTransaction.create({
                data: {
                    customerId,
                    points: redeemPoints,
                    type: client_1.LoyaltyTxType.REDEEM,
                    reference: `Order ${order.id}`,
                },
            }));
        }
        if (customerId) {
            loyaltyTransactions.push(this.prisma.loyaltyTransaction.create({
                data: {
                    customerId,
                    points: 2,
                    type: client_1.LoyaltyTxType.EARN,
                    reference: `Order ${order.id}`,
                },
            }));
        }
        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                paymentMethod: dto.paymentMethod,
                paymentLabel: dto.paymentLabel,
                receiptUrl: dto.receiptUrl,
                paidAt: new Date(),
                status: client_1.OrderStatus.COMPLETED,
                total: paidTotal,
                customerId: customerId || undefined,
                ...(appliedPromotionId ? { promotionId: appliedPromotionId } : {}),
            },
            include: this.orderInclude,
        });
        const postPayTasks = [...loyaltyTransactions];
        if (appliedPromotionId) {
            const origTotal = Number(order.total);
            const promoDiscount = Number((origTotal - paidTotal).toFixed(2));
            const prePayTotal = redeemPoints > 0
                ? Number((origTotal * 0.95).toFixed(2))
                : origTotal;
            const totalDiscountGiven = Number((Number(order.total) - paidTotal).toFixed(2));
            postPayTasks.push(this.promotions.recordUsage(appliedPromotionId, Math.max(totalDiscountGiven, 0)));
        }
        if (postPayTasks.length) {
            await Promise.all(postPayTasks);
        }
        return this.enrichOrder(updatedOrder);
    }
    async findLive(branchId, page = 0, limit = 50) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        const orders = await this.prisma.order.findMany({
            where: {
                branchId,
                status: { in: [client_1.OrderStatus.NEW, client_1.OrderStatus.PREPARING, client_1.OrderStatus.READY] },
            },
            include: this.orderInclude,
            orderBy: { createdAt: 'asc' },
            take,
            skip,
        });
        return orders.map((order) => this.enrichOrder(order));
    }
    buildOrderWhere(branchId, params) {
        const search = params.search?.trim();
        return {
            branchId,
            ...(params.status && { status: params.status }),
            ...(params.channel && { channel: params.channel }),
            ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
            ...(params.from && { createdAt: { gte: new Date(params.from) } }),
            ...(params.to && { createdAt: { lte: new Date(params.to) } }),
            ...(search
                ? {
                    OR: [
                        { id: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } },
                        { customer: { name: { contains: search, mode: client_1.Prisma.QueryMode.insensitive } } },
                    ],
                }
                : {}),
        };
    }
    async getStats(branchId, params) {
        const where = this.buildOrderWhere(branchId, params);
        const [count, agg] = await Promise.all([
            this.prisma.order.count({ where }),
            this.prisma.order.aggregate({
                where,
                _sum: { total: true, foodCost: true },
            }),
        ]);
        const totalRevenue = Number(agg._sum.total ?? 0);
        const foodCost = Number(agg._sum.foodCost ?? 0);
        const avgTicket = count > 0 ? Number((totalRevenue / count).toFixed(2)) : 0;
        return { count, totalRevenue, foodCost, avgTicket };
    }
    async findAll(branchId, params, page = 0, limit = 50) {
        const take = Math.min(Math.max(limit, 1), 100);
        const skip = Math.max(page, 0) * take;
        const orders = await this.prisma.order.findMany({
            where: this.buildOrderWhere(branchId, params),
            include: this.orderInclude,
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
        return orders.map((order) => this.enrichOrder(order));
    }
    async cancel(id) {
        return this.prisma.order.update({
            where: { id },
            data: { status: client_1.OrderStatus.CANCELLED },
            include: this.orderInclude,
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        promotions_service_1.PromotionsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map