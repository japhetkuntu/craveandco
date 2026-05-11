import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemsDto, PayOrderDto, AddOrderItemDto } from './dto/orders.dto';
import { OrderStatus, OrderChannel, PaymentMethod, Prisma, LoyaltyTxType } from '@prisma/client';
import { PromotionsService } from '../promotions/promotions.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private promotions: PromotionsService,
  ) {}

  private orderInclude = {
    items: {
      include: {
        menuItem: { include: { category: true } },
        ingredientCosts: true,
      },
    },
    customer: true,
  };

  private async loadMenuItemsWithCosts(menuItemIds: string[]) {
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { recipeItems: { include: { ingredient: true } } },
    });

    const menuItemsMap = new Map(menuItems.map((m) => [m.id, m]));
    const ingredientCostsMap = new Map(
      menuItems.map((m) => [
        m.id,
        m.recipeItems.map((ri) => ({
          ingredientId: ri.ingredientId,
          ingredientName: ri.ingredient.name,
          ingredientUnit: ri.unit || ri.ingredient.unit,
          quantity: Number(ri.quantity),
          unitCost: Number(ri.ingredient.currentCost),
          totalCost: Number(ri.quantity) * Number(ri.ingredient.currentCost),
        })),
      ]),
    );

    const costMap = new Map(
      menuItems.map((m) => [
        m.id,
        (ingredientCostsMap.get(m.id) || []).reduce((sum, cost) => sum + cost.totalCost, 0),
      ]),
    );

    return { menuItemsMap, ingredientCostsMap, costMap };
  }

  private getSelectedOptionAdjustment(
    menuItem: any,
    selectedOptions?: { optionId: string; values: string[] }[],
  ) {
    if (!menuItem?.options || !Array.isArray(selectedOptions)) return 0;

    const optionMap = new Map(((menuItem.options || []) as any[]).map((opt: any) => [opt.id, opt]));
    return selectedOptions.reduce((sum, selected) => {
      const option = optionMap.get(selected.optionId);
      if (!option || !Array.isArray(option.values) || !Array.isArray(selected.values)) return sum;

      const valueMap = new Map(((option.values || []) as any[]).map((value: any) => [value.id, value]));
      return sum + selected.values.reduce((valueSum, valueId) => {
        const value = valueMap.get(valueId);
        return valueSum + (Number(value?.priceAdjustment || 0));
      }, 0);
    }, 0);
  }

  private calculateMenuItemPrice(
    menuItem: any,
    selectedOptions?: { optionId: string; values: string[] }[],
  ) {
    const basePrice = Number(menuItem?.price || 0);
    return Number((basePrice + this.getSelectedOptionAdjustment(menuItem, selectedOptions)).toFixed(2));
  }

  private normalizeSelectedOptions(
    menuItem: any,
    selectedOptions?: { optionId: string; values: string[] }[],
  ) {
    if (!Array.isArray(selectedOptions) || !menuItem?.options) return selectedOptions;
    const optionMap = new Map(((menuItem.options || []) as any[]).map((opt: any) => [opt.id, opt]));
    return selectedOptions.map((selected) => {
      const option = optionMap.get(selected.optionId);
      const valueMap = new Map(((option?.values || []) as any[]).map((value: any) => [value.id, value]));
      const labels = (selected.values || []).map((valueId) => valueMap.get(valueId)?.label || valueId);
      return {
        optionId: selected.optionId,
        optionName: option?.name,
        values: selected.values,
        labels,
      };
    });
  }

  private calculateTotals(
    items: { menuItemId: string; quantity: number; selectedOptions?: { optionId: string; values: string[] }[] }[],
    menuItemsMap: Map<string, any>,
    costMap: Map<string, number>,
  ) {
    const total = items.reduce((sum, item) => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      const unitPrice = this.calculateMenuItemPrice(menuItem, item.selectedOptions);
      return sum + unitPrice * item.quantity;
    }, 0);
    const foodCost = items.reduce(
      (sum, item) => sum + (costMap.get(item.menuItemId) || 0) * item.quantity,
      0,
    );
    return { total, foodCost };
  }

  async create(dto: CreateOrderDto) {
    const { menuItemsMap, ingredientCostsMap, costMap } = await this.loadMenuItemsWithCosts(
      dto.items.map((i) => i.menuItemId),
    );
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

  private enrichOrder(order: any) {
    const subtotal = order.items.reduce(
      (sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );
    const discountAmount = Math.max(subtotal - Number(order.total), 0);
    return { ...order, subtotal, discountAmount };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.enrichOrder(order);
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status as OrderStatus },
      include: this.orderInclude,
    });
  }

  async updateItems(id: string, dto: UpdateOrderItemsDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException('Can only update items on NEW orders');
    }

    const { menuItemsMap, ingredientCostsMap, costMap } = await this.loadMenuItemsWithCosts(
      dto.items.map((i) => i.menuItemId),
    );
    const { total, foodCost } = this.calculateTotals(dto.items, menuItemsMap, costMap);

    // Delete existing items and recreate
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

  async addItem(id: string, dto: AddOrderItemDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException('Can only add items to NEW orders');
    }

    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: dto.menuItemId },
      include: { recipeItems: { include: { ingredient: true } } },
    });
    if (!menuItem) throw new NotFoundException('Menu item not found');

    const unitCost = menuItem.recipeItems.reduce(
      (sum, ri) => sum + Number(ri.quantity) * Number(ri.ingredient.currentCost),
      0,
    );
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

  async removeItem(orderId: string, itemId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException('Can only remove items from NEW orders');
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

  async pay(id: string, dto: PayOrderDto) {
    let order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay a cancelled order');
    }
    if (order.paidAt) {
      throw new BadRequestException('Order already paid');
    }

    const customerId = dto.customerId || order.customerId;
    if (dto.customerId && !order.customerId) {
      order = await this.prisma.order.update({
        where: { id },
        data: { customerId: dto.customerId },
      });
    }

    let paidTotal = Number(order.total);
    const loyaltyTransactions: Array<Promise<any>> = [];
    let appliedPromotionId: string | undefined;

    // Apply promotion discount first
    if (dto.promotionId) {
      const promotion = await this.promotions.findById(dto.promotionId);
      if (!promotion) throw new BadRequestException('Promotion not found');
      if (promotion.status !== 'ACTIVE') throw new BadRequestException('Promotion is not active');
      const now = new Date();
      if (promotion.startDate && promotion.startDate > now) {
        throw new BadRequestException('Promotion has not started yet');
      }
      if (promotion.endDate && promotion.endDate < now) {
        throw new BadRequestException('Promotion has expired');
      }
      if (promotion.minOrderAmount && paidTotal < Number(promotion.minOrderAmount)) {
        throw new BadRequestException(
          `Order total must be at least ${promotion.minOrderAmount} to apply this promotion`,
        );
      }
      const { discountAmount, finalTotal } = this.promotions.calculateDiscount(
        dto.promotionId,
        paidTotal,
        promotion,
      );
      paidTotal = finalTotal;
      appliedPromotionId = dto.promotionId;
      // Record promotion usage after successful payment (deferred below)
    }

    const redeemPoints = dto.redeemPoints === 100 ? 100 : 0;

    if (dto.redeemPoints && dto.redeemPoints !== 100) {
      throw new BadRequestException('Redeem points must be exactly 100 for a 5% discount');
    }

    if (redeemPoints > 0) {
      if (!customerId) {
        throw new BadRequestException('Customer must be assigned to redeem loyalty points');
      }

      const [earned, redeemed] = await Promise.all([
        this.prisma.loyaltyTransaction.aggregate({
          where: { customerId, type: LoyaltyTxType.EARN },
          _sum: { points: true },
        }),
        this.prisma.loyaltyTransaction.aggregate({
          where: { customerId, type: { in: [LoyaltyTxType.REDEEM, LoyaltyTxType.EXPIRE] } },
          _sum: { points: true },
        }),
      ]);

      const earnedPoints = Number(earned._sum?.points || 0);
      const redeemedPoints = Math.abs(Number(redeemed._sum?.points || 0));
      const balance = earnedPoints - redeemedPoints;

      if (balance < redeemPoints) {
        throw new BadRequestException('Insufficient loyalty points to redeem');
      }

      const discountFactor = 0.05;
      const discountAmount = Number((paidTotal * discountFactor).toFixed(2));
      paidTotal = Number((paidTotal - discountAmount).toFixed(2));

      loyaltyTransactions.push(
        this.prisma.loyaltyTransaction.create({
          data: {
            customerId,
            points: redeemPoints,
            type: LoyaltyTxType.REDEEM,
            reference: `Order ${order.id}`,
          },
        }),
      );
    }

    if (customerId) {
      loyaltyTransactions.push(
        this.prisma.loyaltyTransaction.create({
          data: {
            customerId,
            points: 2,
            type: LoyaltyTxType.EARN,
            reference: `Order ${order.id}`,
          },
        }),
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        paymentMethod: dto.paymentMethod,
        paymentLabel: dto.paymentLabel,
        receiptUrl: dto.receiptUrl,
        paidAt: new Date(),
        status: OrderStatus.COMPLETED,
        total: paidTotal,
        customerId: customerId || undefined,
        ...(appliedPromotionId ? { promotionId: appliedPromotionId } : {}),
      },
      include: this.orderInclude,
    });

    const postPayTasks: Array<Promise<any>> = [...loyaltyTransactions];

    if (appliedPromotionId) {
      const origTotal = Number(order.total);
      const promoDiscount = Number((origTotal - paidTotal).toFixed(2));
      // Adjust for loyalty discount which was applied after promo
      const prePayTotal = redeemPoints > 0
        ? Number((origTotal * 0.95).toFixed(2))  // loyalty was applied on original total; we need on post-promo total
        : origTotal;
      // More accurately: discount = orig - final
      const totalDiscountGiven = Number((Number(order.total) - paidTotal).toFixed(2));
      postPayTasks.push(this.promotions.recordUsage(appliedPromotionId, Math.max(totalDiscountGiven, 0)));
    }

    if (postPayTasks.length) {
      await Promise.all(postPayTasks);
    }

    return this.enrichOrder(updatedOrder);
  }

  async findLive(branchId: string, page = 0, limit = 50) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        status: { in: [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY] },
      },
      include: this.orderInclude,
      orderBy: { createdAt: 'asc' },
      take,
      skip,
    });
    return orders.map((order) => this.enrichOrder(order));
  }

  private buildOrderWhere(
    branchId: string,
    params: { status?: string; channel?: string; paymentMethod?: string; from?: string; to?: string; search?: string },
  ) {
    const search = params.search?.trim();
    return {
      branchId,
      ...(params.status && { status: params.status as OrderStatus }),
      ...(params.channel && { channel: params.channel as OrderChannel }),
      ...(params.paymentMethod && { paymentMethod: params.paymentMethod as PaymentMethod }),
      ...(params.from && { createdAt: { gte: new Date(params.from) } }),
      ...(params.to && { createdAt: { lte: new Date(params.to) } }),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { customer: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
            ],
          }
        : {}),
    };
  }

  async getStats(
    branchId: string,
    params: { status?: string; channel?: string; paymentMethod?: string; from?: string; to?: string; search?: string },
  ) {
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

  async findAll(
    branchId: string,
    params: { status?: string; channel?: string; paymentMethod?: string; from?: string; to?: string; search?: string },
    page = 0,
    limit = 50,
  ) {
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

  async cancel(id: string) {
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: this.orderInclude,
    });
  }
}
