import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemsDto, PayOrderDto, AddOrderItemDto } from './dto/orders.dto';
import { OrderStatus, OrderChannel, PaymentMethod, Prisma, LoyaltyTxType } from '@prisma/client';
import { PromotionsService } from '../promotions/promotions.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private promotions: PromotionsService,
    private files: FilesService,
  ) {}

  private orderInclude = {
    items: {
      include: {
        menuItem: { include: { category: true } },
        ingredientCosts: true,
      },
    },
    customer: true,
    initiatedBy: { select: { id: true, name: true } },
  };

  private readonly groupedComponentsOptionId = '__meta_grouped_menu_components';

  private attachImageUrl(menuItem: any) {
    if (!menuItem) return menuItem;
    return {
      ...menuItem,
      imageUrl: menuItem.imageKey ? this.files.getImageUrl(menuItem.imageKey) : null,
    };
  }

  private attachImageUrlsToOrder(order: any) {
    return {
      ...order,
      items: order.items.map((item: any) => ({
        ...item,
        menuItem: this.attachImageUrl(item.menuItem),
      })),
    };
  }

  private getGroupedComponentIds(menuItem: any): string[] {
    const options = Array.isArray(menuItem?.options) ? menuItem.options : [];
    const groupedOption = options.find(
      (option: any) => option?.id === this.groupedComponentsOptionId,
    );
    const values = Array.isArray(groupedOption?.values) ? groupedOption.values : [];
    return Array.from(
      new Set(
        values
          .map((value: any) => value?.id)
          .filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0),
      ),
    );
  }

  private mergeIngredientCosts(costs: any[]) {
    const merged = new Map<string, any>();

    for (const cost of costs) {
      const key = cost.ingredientId;
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += Number(cost.quantity || 0);
        existing.totalCost += Number(cost.totalCost || 0);
      } else {
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

  private resolveIngredientCostsForMenuItem(
    menuItemId: string,
    menuItemsMap: Map<string, any>,
    memo: Map<string, any[]>,
    visiting: Set<string>,
  ) {
    if (memo.has(menuItemId)) return memo.get(menuItemId) || [];
    if (visiting.has(menuItemId)) return [];

    visiting.add(menuItemId);
    const menuItem = menuItemsMap.get(menuItemId);
    if (!menuItem) {
      visiting.delete(menuItemId);
      memo.set(menuItemId, []);
      return [];
    }

    const groupedComponentIds = this.getGroupedComponentIds(menuItem).filter(
      (id) => id !== menuItemId,
    );

    let ingredientCosts: any[];
    if (groupedComponentIds.length > 0) {
      const componentCosts = groupedComponentIds.flatMap((sourceId) =>
        this.resolveIngredientCostsForMenuItem(sourceId, menuItemsMap, memo, visiting),
      );
      ingredientCosts = this.mergeIngredientCosts(componentCosts);
    } else {
      ingredientCosts = (menuItem.recipeItems || []).map((ri: any) => ({
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

  private async loadMenuItemsWithCosts(menuItemIds: string[]) {
    const pendingIds = new Set(menuItemIds);
    const menuItemsMap = new Map<string, any>();

    while (pendingIds.size > 0) {
      const idsToLoad = Array.from(pendingIds).filter((id) => !menuItemsMap.has(id));
      pendingIds.clear();
      if (idsToLoad.length === 0) break;

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

    const ingredientMemo = new Map<string, any[]>();
    const ingredientCostsMap = new Map<string, any[]>();

    menuItemIds.forEach((id) => {
      ingredientCostsMap.set(
        id,
        this.resolveIngredientCostsForMenuItem(id, menuItemsMap, ingredientMemo, new Set()),
      );
    });

    const costMap = new Map(
      menuItemIds.map((id) => [
        id,
        (ingredientCostsMap.get(id) || []).reduce((sum, cost) => sum + cost.totalCost, 0),
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

  async create(dto: CreateOrderDto, initiatedById?: string) {
    const { menuItemsMap, ingredientCostsMap, costMap } = await this.loadMenuItemsWithCosts(
      dto.items.map((i) => i.menuItemId),
    );
    const { total, foodCost } = this.calculateTotals(dto.items, menuItemsMap, costMap);

    const createdOrder = await this.prisma.order.create({
      data: {
        branchId: dto.branchId,
        channel: dto.channel,
        paymentMethod: dto.paymentMethod,
        customerId: dto.customerId,
        guestName: dto.guestName,
        notes: dto.notes,
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
    return this.enrichOrder(createdOrder);
  }

  private enrichOrder(order: any) {
    const orderWithImages = this.attachImageUrlsToOrder(order);
    const subtotal = orderWithImages.items.reduce(
      (sum: number, item: any) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );
    const discountAmount = Math.max(subtotal - Number(orderWithImages.total), 0);
    return { ...orderWithImages, subtotal, discountAmount };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.enrichOrder(order);
  }

  async findByCustomerId(customerId: string, page = 0, limit = 50) {
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

  async findOneByCustomerId(customerId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, customerId },
      include: this.orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return this.enrichOrder(order);
  }

  async updatePaymentReference(
    orderId: string,
    paymentReference: string,
    paymentStatus: string,
    receiptUrl?: string,
    paymentMethod?: PaymentMethod,
    paymentLabel?: string,
  ) {
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

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as OrderStatus },
      include: this.orderInclude,
    });
    return this.enrichOrder(updated);
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
    return this.enrichOrder(updated);
  }

  async addItem(id: string, dto: AddOrderItemDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.NEW) {
      throw new BadRequestException('Can only add items to NEW orders');
    }

    const { menuItemsMap, ingredientCostsMap, costMap } = await this.loadMenuItemsWithCosts([
      dto.menuItemId,
    ]);
    const menuItem = menuItemsMap.get(dto.menuItemId);
    if (!menuItem) throw new NotFoundException('Menu item not found');

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

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { total, foodCost },
      include: this.orderInclude,
    });
    return this.enrichOrder(updated);
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
      // Enforce menu item scope
      if ((promotion as any).menuScope === 'SPECIFIC') {
        const allowedIds: string[] = (promotion as any).menuItemIds ?? [];
        const orderItems = await this.prisma.orderItem.findMany({
          where: { orderId: id },
          select: { menuItemId: true },
        });
        const hasEligibleItem = orderItems.some(
          (oi) => oi.menuItemId && allowedIds.includes(oi.menuItemId),
        );
        if (!hasEligibleItem) {
          throw new BadRequestException('This promotion does not apply to any items in the order');
        }
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
    params: { status?: string; channel?: string; paymentMethod?: string; from?: string; to?: string; search?: string; categoryIds?: string[] },
  ) {
    const search = params.search?.trim();
    return {
      branchId,
      ...(params.status && { status: params.status as OrderStatus }),
      ...(params.channel && { channel: params.channel as OrderChannel }),
      ...(params.paymentMethod && { paymentMethod: params.paymentMethod as PaymentMethod }),
      ...((params.from || params.to) && {
        createdAt: {
          ...(params.from && { gte: new Date(params.from) }),
          ...(params.to && {
            lt: (() => {
              const d = new Date(params.to!);
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
              { id: { contains: search, mode: Prisma.QueryMode.insensitive } },
              { customer: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } },
            ],
          }
        : {}),
    };
  }

  async getStats(
    branchId: string,
    params: { status?: string; channel?: string; paymentMethod?: string; from?: string; to?: string; search?: string; categoryIds?: string[] },
  ) {
    const where = this.buildOrderWhere(branchId, params);

    // When no status filter is provided, exclude cancelled orders from revenue stats.
    // If the user explicitly filters for CANCELLED, show those stats as-is.
    if (!params.status) {
      (where as any).status = { not: OrderStatus.CANCELLED };
    }

    if (params.categoryIds?.length) {
      // When filtering by category, revenue must be summed at item level (not order.total)
      // so we only count revenue from the matching items, not the full order value.
      const { items: _items, ...orderWhere } = where as any;
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

  async findAll(
    branchId: string,
    params: { status?: string; channel?: string; paymentMethod?: string; from?: string; to?: string; search?: string; categoryIds?: string[] },
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

    const enriched = orders.map((order) => this.enrichOrder(order));

    if (params.categoryIds?.length) {
      const catIds = params.categoryIds;
      return enriched.map((order) => ({
        ...order,
        matchedItemCount: order.items.filter((item: any) => catIds.includes(item.menuItem?.category?.id ?? '')).length,
      }));
    }

    return enriched;
  }

  async cancel(id: string) {
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: this.orderInclude,
    });
    return this.enrichOrder(updated);
  }
}
