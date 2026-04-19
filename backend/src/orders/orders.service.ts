import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemsDto, PayOrderDto, AddOrderItemDto } from './dto/orders.dto';
import { OrderStatus, OrderChannel, PaymentMethod, Prisma, LoyaltyTxType } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

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

    const priceMap = new Map(menuItems.map((m) => [m.id, Number(m.price)]));
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

    return { priceMap, costMap, ingredientCostsMap };
  }

  private calculateTotals(
    items: { menuItemId: string; quantity: number }[],
    priceMap: Map<string, number>,
    costMap: Map<string, number>,
  ) {
    const total = items.reduce(
      (sum, item) => sum + (priceMap.get(item.menuItemId) || 0) * item.quantity,
      0,
    );
    const foodCost = items.reduce(
      (sum, item) => sum + (costMap.get(item.menuItemId) || 0) * item.quantity,
      0,
    );
    return { total, foodCost };
  }

  async create(dto: CreateOrderDto) {
    const { priceMap, costMap, ingredientCostsMap } = await this.loadMenuItemsWithCosts(
      dto.items.map((i) => i.menuItemId),
    );
    const { total, foodCost } = this.calculateTotals(dto.items, priceMap, costMap);

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
          create: dto.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: priceMap.get(item.menuItemId) || 0,
            unitCost: costMap.get(item.menuItemId) || 0,
            notes: item.notes,
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
          })),
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

    const { priceMap, costMap, ingredientCostsMap } = await this.loadMenuItemsWithCosts(
      dto.items.map((i) => i.menuItemId),
    );
    const { total, foodCost } = this.calculateTotals(dto.items, priceMap, costMap);

    // Delete existing items and recreate
    await this.prisma.orderItem.deleteMany({ where: { orderId: id } });

    return this.prisma.order.update({
      where: { id },
      data: {
        total,
        foodCost,
        items: {
          create: dto.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: priceMap.get(item.menuItemId) || 0,
            unitCost: costMap.get(item.menuItemId) || 0,
            notes: item.notes,
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
          })),
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

    await this.prisma.orderItem.create({
      data: {
        orderId: id,
        menuItemId: dto.menuItemId,
        quantity: dto.quantity,
        unitPrice: menuItem.price,
        unitCost,
        notes: dto.notes,
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
      },
      include: this.orderInclude,
    });

    if (loyaltyTransactions.length) {
      await Promise.all(loyaltyTransactions);
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

  async findAll(
    branchId: string,
    params: { status?: string; channel?: string; paymentMethod?: string; from?: string; to?: string; search?: string },
    page = 0,
    limit = 50,
  ) {
    const search = params.search?.trim();
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = Math.max(page, 0) * take;

    const orders = await this.prisma.order.findMany({
      where: {
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
      },
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
