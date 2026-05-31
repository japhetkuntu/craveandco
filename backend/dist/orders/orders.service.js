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
const files_service_1 = require("../files/files.service");
let OrdersService = class OrdersService {
    prisma;
    promotions;
    files;
    rewardExpiryMs = 24 * 60 * 60 * 1000;
    constructor(prisma, promotions, files) {
        this.prisma = prisma;
        this.promotions = promotions;
        this.files = files;
    }
    orderInclude = {
        items: {
            include: {
                menuItem: { include: { category: true } },
                ingredientCosts: true,
            },
        },
        customer: true,
        initiatedBy: { select: { id: true, name: true } },
    };
    groupedComponentsOptionId = '__meta_grouped_menu_components';
    isActiveRaffleSpin(spin, now = new Date()) {
        if (spin.redeemedAt)
            return false;
        return now.getTime() - spin.createdAt.getTime() < this.rewardExpiryMs;
    }
    attachImageUrl(menuItem) {
        if (!menuItem)
            return menuItem;
        return {
            ...menuItem,
            imageUrl: menuItem.imageKey ? this.files.getImageUrl(menuItem.imageKey) : null,
        };
    }
    attachImageUrlsToOrder(order) {
        return {
            ...order,
            items: order.items.map((item) => ({
                ...item,
                menuItem: this.attachImageUrl(item.menuItem),
            })),
        };
    }
    getGroupedComponentIds(menuItem) {
        const options = Array.isArray(menuItem?.options) ? menuItem.options : [];
        const groupedOption = options.find((option) => option?.id === this.groupedComponentsOptionId);
        const values = Array.isArray(groupedOption?.values) ? groupedOption.values : [];
        return Array.from(new Set(values
            .map((value) => value?.id)
            .filter((id) => typeof id === 'string' && id.trim().length > 0)));
    }
    mergeIngredientCosts(costs) {
        const merged = new Map();
        for (const cost of costs) {
            const key = cost.ingredientId;
            const existing = merged.get(key);
            if (existing) {
                existing.quantity += Number(cost.quantity || 0);
                existing.totalCost += Number(cost.totalCost || 0);
            }
            else {
                merged.set(key, {
                    ingredientId: cost.ingredientId,
                    ingredientName: cost.ingredientName,
                    ingredientUnit: cost.ingredientUnit,
                    quantity: Number(cost.quantity || 0),
                    unitCost: Number(cost.unitCost || 0),
                    totalCost: Number(cost.totalCost || 0),
                });
            }
        }
        return Array.from(merged.values());
    }
    resolveIngredientCostsForMenuItem(menuItemId, menuItemsMap, memo, visiting) {
        if (memo.has(menuItemId))
            return memo.get(menuItemId) || [];
        if (visiting.has(menuItemId))
            return [];
        visiting.add(menuItemId);
        const menuItem = menuItemsMap.get(menuItemId);
        if (!menuItem) {
            visiting.delete(menuItemId);
            memo.set(menuItemId, []);
            return [];
        }
        const groupedComponentIds = this.getGroupedComponentIds(menuItem).filter((id) => id !== menuItemId);
        let ingredientCosts;
        if (groupedComponentIds.length > 0) {
            const componentCosts = groupedComponentIds.flatMap((sourceId) => this.resolveIngredientCostsForMenuItem(sourceId, menuItemsMap, memo, visiting));
            ingredientCosts = this.mergeIngredientCosts(componentCosts);
        }
        else {
            ingredientCosts = (menuItem.recipeItems || []).map((ri) => ({
                ingredientId: ri.ingredientId,
                ingredientName: ri.ingredient.name,
                ingredientUnit: ri.unit || ri.ingredient.unit,
                quantity: Number(ri.quantity),
                unitCost: Number(ri.ingredient.currentCost),
                totalCost: Number(ri.quantity) * Number(ri.ingredient.currentCost),
            }));
        }
        visiting.delete(menuItemId);
        memo.set(menuItemId, ingredientCosts);
        return ingredientCosts;
    }
    async loadMenuItemsWithCosts(menuItemIds) {
        const pendingIds = new Set(menuItemIds);
        const menuItemsMap = new Map();
        while (pendingIds.size > 0) {
            const idsToLoad = Array.from(pendingIds).filter((id) => !menuItemsMap.has(id));
            pendingIds.clear();
            if (idsToLoad.length === 0)
                break;
            const loadedMenuItems = await this.prisma.menuItem.findMany({
                where: { id: { in: idsToLoad } },
                include: { recipeItems: { include: { ingredient: true } } },
            });
            loadedMenuItems.forEach((menuItem) => {
                menuItemsMap.set(menuItem.id, menuItem);
            });
            loadedMenuItems.forEach((menuItem) => {
                this.getGroupedComponentIds(menuItem)
                    .filter((id) => !menuItemsMap.has(id))
                    .forEach((id) => pendingIds.add(id));
            });
        }
        const ingredientMemo = new Map();
        const ingredientCostsMap = new Map();
        menuItemIds.forEach((id) => {
            ingredientCostsMap.set(id, this.resolveIngredientCostsForMenuItem(id, menuItemsMap, ingredientMemo, new Set()));
        });
        const costMap = new Map(menuItemIds.map((id) => [
            id,
            (ingredientCostsMap.get(id) || []).reduce((sum, cost) => sum + cost.totalCost, 0),
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
    async create(dto, initiatedById) {
        const { menuItemsMap, ingredientCostsMap, costMap } = await this.loadMenuItemsWithCosts(dto.items.map((i) => i.menuItemId));
        const { total, foodCost } = this.calculateTotals(dto.items, menuItemsMap, costMap);
        const raffleAccessCode = dto.raffleAccessCode?.trim().toUpperCase() || undefined;
        const createdOrder = await this.prisma.order.create({
            data: {
                branchId: dto.branchId,
                channel: dto.channel,
                paymentMethod: dto.paymentMethod,
                customerId: dto.customerId,
                guestName: dto.guestName,
                notes: dto.notes,
                raffleAccessCode,
                ...(initiatedById ? { initiatedById } : {}),
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
        await this.deductInventoryForOrder(createdOrder.id, dto.branchId, createdOrder.items);
        return this.enrichOrder(createdOrder);
    }
    async deductInventoryForOrder(orderId, branchId, orderItems) {
        const movements = [];
        for (const orderItem of orderItems) {
            if (!orderItem.menuItem?.category?.autoDeductInventory)
                continue;
            for (const cost of orderItem.ingredientCosts ?? []) {
                const qty = Number(cost.quantity) * orderItem.quantity;
                if (qty <= 0)
                    continue;
                movements.push({
                    ingredientId: cost.ingredientId,
                    branchId,
                    type: 'USAGE',
                    quantity: -qty,
                    reason: `Auto-deducted: ${orderItem.menuItem.name} ×${orderItem.quantity}`,
                    referenceId: orderId,
                });
            }
        }
        if (movements.length > 0) {
            await this.prisma.inventoryMovement.createMany({ data: movements });
        }
    }
    async reverseInventoryForOrder(orderId, branchId) {
        const deductions = await this.prisma.inventoryMovement.findMany({
            where: { referenceId: orderId, type: 'USAGE' },
        });
        if (deductions.length === 0)
            return;
        await this.prisma.inventoryMovement.createMany({
            data: deductions.map((m) => ({
                ingredientId: m.ingredientId,
                branchId,
                type: 'ADJUSTMENT',
                quantity: Math.abs(Number(m.quantity)),
                reason: `Reversal: order ${orderId}`,
                referenceId: orderId,
            })),
        });
    }
    enrichOrder(order) {
        const orderWithImages = this.attachImageUrlsToOrder(order);
        const subtotal = orderWithImages.items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
        const discountAmount = Math.max(subtotal - Number(orderWithImages.total), 0);
        return { ...orderWithImages, subtotal, discountAmount };
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
    async findByCustomerId(customerId, page = 0, limit = 50) {
        const take = Math.min(Math.max(limit, 1), 100);
        const skip = Math.max(page, 0) * take;
        const orders = await this.prisma.order.findMany({
            where: { customerId },
            include: this.orderInclude,
            orderBy: { createdAt: 'desc' },
            take,
            skip,
        });
        return orders.map((order) => this.enrichOrder(order));
    }
    async findOneByCustomerId(customerId, id) {
        const order = await this.prisma.order.findFirst({
            where: { id, customerId },
            include: this.orderInclude,
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.enrichOrder(order);
    }
    async updatePaymentReference(orderId, paymentReference, paymentStatus, receiptUrl, paymentMethod, paymentLabel) {
        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                paymentReference,
                paymentStatus,
                ...(receiptUrl ? { receiptUrl } : {}),
                ...(paymentMethod ? { paymentMethod } : {}),
                ...(paymentLabel ? { paymentLabel } : {}),
            },
            include: this.orderInclude,
        });
    }
    async updateStatus(id, dto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const updated = await this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
            include: this.orderInclude,
        });
        if (dto.status === client_1.OrderStatus.COMPLETED &&
            order.status !== client_1.OrderStatus.COMPLETED &&
            updated.customerId) {
            await this.prisma.customer.update({
                where: { id: updated.customerId },
                data: {
                    lastSeenAt: new Date(),
                    visitCount: { increment: 1 },
                },
            });
        }
        if (dto.status === client_1.OrderStatus.CANCELLED && order.status !== client_1.OrderStatus.CANCELLED) {
            await this.reverseInventoryForOrder(id, order.branchId);
        }
        return this.enrichOrder(updated);
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
        await this.reverseInventoryForOrder(id, order.branchId);
        await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
        const updated = await this.prisma.order.update({
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
        await this.deductInventoryForOrder(id, order.branchId, updated.items);
        return this.enrichOrder(updated);
    }
    async addItem(id, dto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status !== client_1.OrderStatus.NEW) {
            throw new common_1.BadRequestException('Can only add items to NEW orders');
        }
        const { menuItemsMap, ingredientCostsMap, costMap } = await this.loadMenuItemsWithCosts([
            dto.menuItemId,
        ]);
        const menuItem = menuItemsMap.get(dto.menuItemId);
        if (!menuItem)
            throw new common_1.NotFoundException('Menu item not found');
        const unitCost = costMap.get(dto.menuItemId) || 0;
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
                    create: (ingredientCostsMap.get(dto.menuItemId) || []).map((cost) => ({
                        ingredientId: cost.ingredientId,
                        ingredientName: cost.ingredientName,
                        ingredientUnit: cost.ingredientUnit,
                        quantity: cost.quantity,
                        unitCost: cost.unitCost,
                        totalCost: cost.totalCost,
                    })),
                },
            },
        });
        const items = await this.prisma.orderItem.findMany({ where: { orderId: id } });
        const total = items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0);
        const foodCost = items.reduce((sum, item) => sum + Number(item.unitCost) * item.quantity, 0);
        const updated = await this.prisma.order.update({
            where: { id },
            data: { total, foodCost },
            include: this.orderInclude,
        });
        return this.enrichOrder(updated);
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
        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: { total, foodCost },
            include: this.orderInclude,
        });
        return this.enrichOrder(updated);
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
        let raffleSpinToRedeem;
        const resolvePromotionId = async () => {
            if (dto.promotionId)
                return dto.promotionId;
            if (!dto.raffleAccessCode)
                return undefined;
            const code = dto.raffleAccessCode.trim().toUpperCase();
            const raffleEntry = await this.prisma.customerRaffleEntry.findUnique({
                where: { accessCode: code },
                include: {
                    spins: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            rewardType: true,
                            rewardLabel: true,
                            createdAt: true,
                            redeemedAt: true,
                        },
                    },
                },
            });
            if (!raffleEntry)
                throw new common_1.BadRequestException('No raffle entry found for this access code.');
            const spin = raffleEntry.spins[0];
            if (!spin || !this.isActiveRaffleSpin(spin)) {
                throw new common_1.BadRequestException('No active reward found for this raffle code.');
            }
            const now = new Date();
            const promotion = await this.prisma.promotion.findFirst({
                where: {
                    branchId: order.branchId,
                    raffleRewardType: spin.rewardType,
                    status: 'ACTIVE',
                    OR: [{ startDate: null }, { startDate: { lte: now } }],
                    AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
                },
            });
            if (!promotion)
                throw new common_1.BadRequestException(`No active promotion is linked to the "${spin.rewardLabel}" raffle reward.`);
            raffleSpinToRedeem = { id: spin.id };
            return promotion.id;
        };
        const resolvedPromotionId = await resolvePromotionId();
        if (resolvedPromotionId) {
            const promotion = await this.promotions.findById(resolvedPromotionId);
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
            if (promotion.menuScope === 'SPECIFIC') {
                const allowedIds = promotion.menuItemIds ?? [];
                const orderItems = await this.prisma.orderItem.findMany({
                    where: { orderId: id },
                    select: { menuItemId: true },
                });
                const hasEligibleItem = orderItems.some((oi) => oi.menuItemId && allowedIds.includes(oi.menuItemId));
                if (!hasEligibleItem) {
                    throw new common_1.BadRequestException('This promotion does not apply to any items in the order');
                }
            }
            const itemsForDiscount = await this.prisma.orderItem.findMany({
                where: { orderId: id },
                select: { unitPrice: true, quantity: true },
            });
            const { discountAmount: _unused, finalTotal } = this.promotions.calculateDiscount(resolvedPromotionId, paidTotal, promotion, itemsForDiscount.map((i) => ({
                unitPrice: Number(i.unitPrice),
                quantity: i.quantity,
            })));
            paidTotal = finalTotal;
            appliedPromotionId = resolvedPromotionId;
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
        if (customerId) {
            postPayTasks.push(this.prisma.customer.update({
                where: { id: customerId },
                data: {
                    lastSeenAt: new Date(),
                    visitCount: { increment: 1 },
                },
            }));
        }
        if (appliedPromotionId) {
            const totalDiscountGiven = Number((Number(order.total) - paidTotal).toFixed(2));
            postPayTasks.push(this.promotions.recordUsage(appliedPromotionId, Math.max(totalDiscountGiven, 0)));
        }
        if (raffleSpinToRedeem) {
            const spinId = raffleSpinToRedeem.id;
            const orderId = updatedOrder.id;
            postPayTasks.push(this.prisma.customerRaffleSpin.update({
                where: { id: spinId },
                data: {
                    redeemedAt: new Date(),
                    redeemedOrderId: orderId,
                    redemptionNote: `Auto-redeemed via POS payment`,
                },
            }));
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
            ...((params.from || params.to) && {
                createdAt: {
                    ...(params.from && { gte: new Date(params.from) }),
                    ...(params.to && {
                        lt: (() => {
                            const d = new Date(params.to);
                            d.setHours(0, 0, 0, 0);
                            d.setDate(d.getDate() + 1);
                            return d;
                        })(),
                    }),
                },
            }),
            ...(params.categoryIds?.length && {
                items: { some: { menuItem: { categoryId: { in: params.categoryIds } } } },
            }),
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
        if (!params.status) {
            where.status = { not: client_1.OrderStatus.CANCELLED };
        }
        if (params.categoryIds?.length) {
            const { items: _items, ...orderWhere } = where;
            const [orderCount, matchingItems] = await Promise.all([
                this.prisma.order.count({ where }),
                this.prisma.orderItem.findMany({
                    where: {
                        order: orderWhere,
                        menuItem: { categoryId: { in: params.categoryIds } },
                    },
                    select: { unitPrice: true, unitCost: true, quantity: true },
                }),
            ]);
            const totalRevenue = Math.round(matchingItems.reduce((s, i) => s + Number(i.unitPrice) * i.quantity, 0) * 100) / 100;
            const foodCost = Math.round(matchingItems.reduce((s, i) => s + Number(i.unitCost) * i.quantity, 0) * 100) / 100;
            const avgTicket = orderCount > 0 ? Number((totalRevenue / orderCount).toFixed(2)) : 0;
            return { count: orderCount, totalRevenue, foodCost, avgTicket };
        }
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
        const enriched = orders.map((order) => this.enrichOrder(order));
        if (params.categoryIds?.length) {
            const catIds = params.categoryIds;
            return enriched.map((order) => ({
                ...order,
                matchedItemCount: order.items.filter((item) => catIds.includes(item.menuItem?.category?.id ?? '')).length,
            }));
        }
        return enriched;
    }
    async cancel(id) {
        const updated = await this.prisma.order.update({
            where: { id },
            data: { status: client_1.OrderStatus.CANCELLED },
            include: this.orderInclude,
        });
        return this.enrichOrder(updated);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        promotions_service_1.PromotionsService,
        files_service_1.FilesService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map