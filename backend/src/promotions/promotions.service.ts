import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotions.dto';
import { PromotionStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePromotionDto, branchId: string) {
    if (dto.type === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }
    const menuScope = dto.menuScope ?? 'ALL';
    const menuItemIds = menuScope === 'SPECIFIC' ? (dto.menuItemIds ?? []) : [];
    const discountScope = dto.discountScope ?? 'ALL_ITEMS';
    return this.prisma.promotion.create({
      data: {
        branchId,
        name: dto.name,
        description: dto.description,
        type: dto.type as any,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount,
        maxDiscount: dto.maxDiscount,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        menuScope,
        menuItemIds,
        discountScope,
        raffleRewardType: dto.raffleRewardType ?? null,
      },
    });
  }

  async findAll(branchId: string) {
    return this.prisma.promotion.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdatePromotionDto, branchId: string) {
    const promotion = await this.prisma.promotion.findFirst({ where: { id, branchId } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    if (dto.type === 'PERCENTAGE' && dto.value !== undefined && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }
    const menuScope = dto.menuScope ?? (promotion as any).menuScope;
    const menuItemIds =
      dto.menuItemIds !== undefined
        ? menuScope === 'SPECIFIC'
          ? dto.menuItemIds
          : []
        : undefined;
    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.type !== undefined && { type: dto.type as any }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
        ...(dto.maxDiscount !== undefined && { maxDiscount: dto.maxDiscount }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
        ...(dto.menuScope !== undefined && { menuScope }),
        ...(menuItemIds !== undefined && { menuItemIds }),
        ...(dto.discountScope !== undefined && { discountScope: dto.discountScope }),
        ...(dto.raffleRewardType !== undefined && { raffleRewardType: dto.raffleRewardType || null }),
      },
    });
  }

  async findActive(branchId: string) {
    const now = new Date();
    return this.prisma.promotion.findMany({
      where: {
        branchId,
        status: PromotionStatus.ACTIVE,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async activate(id: string, branchId: string) {
    const promotion = await this.prisma.promotion.findFirst({ where: { id, branchId } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    if (promotion.status === PromotionStatus.EXPIRED) {
      throw new BadRequestException('Cannot activate an expired promotion');
    }
    return this.prisma.promotion.update({
      where: { id },
      data: { status: PromotionStatus.ACTIVE },
    });
  }

  async pause(id: string, branchId: string) {
    const promotion = await this.prisma.promotion.findFirst({ where: { id, branchId } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return this.prisma.promotion.update({
      where: { id },
      data: { status: PromotionStatus.PAUSED },
    });
  }

  async deactivate(id: string, branchId: string) {
    const promotion = await this.prisma.promotion.findFirst({ where: { id, branchId } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return this.prisma.promotion.update({
      where: { id },
      data: { status: PromotionStatus.DRAFT },
    });
  }

  async remove(id: string, branchId: string) {
    const promotion = await this.prisma.promotion.findFirst({ where: { id, branchId } });
    if (!promotion) throw new NotFoundException('Promotion not found');
    if (promotion.usageCount > 0) {
      throw new BadRequestException('Cannot delete a promotion that has been used');
    }
    return this.prisma.promotion.delete({ where: { id } });
  }

  async getAnalytics(branchId: string, from: string, to: string) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const promotions = await this.prisma.promotion.findMany({
      where: { branchId },
      include: {
        orders: {
          where: {
            createdAt: { gte: start, lte: end },
            status: { not: OrderStatus.CANCELLED },
          },
          select: { id: true, total: true, items: { select: { quantity: true, unitPrice: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return promotions.map((p) => {
      const periodOrders = p.orders;
      const periodRevenue = periodOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const periodSubtotal = periodOrders.reduce(
        (sum, o) =>
          sum + o.items.reduce((s, item) => s + Number(item.unitPrice) * item.quantity, 0),
        0,
      );
      const periodDiscount = Math.max(periodSubtotal - periodRevenue, 0);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        value: Number(p.value),
        minOrderAmount: p.minOrderAmount ? Number(p.minOrderAmount) : null,
        maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
        startDate: p.startDate,
        endDate: p.endDate,
        status: p.status,
        usageCount: p.usageCount,
        totalDiscount: Number(p.totalDiscount),
        periodOrders: periodOrders.length,
        periodRevenue,
        periodDiscount,
        createdAt: p.createdAt,
      };
    });
  }

  /**
   * Calculate the discount amount for an order.
   *
   * @param subtotal - full order subtotal (sum of all item prices × qty)
   * @param promotion - the Promotion record
   * @param orderItems - optional array of { unitPrice, quantity } used when
   *                     discountScope === 'FIRST_ITEM' (applies to the most
   *                     expensive item only)
   * @returns { discountAmount, finalTotal }
   */
  calculateDiscount(
    promotionId: string,
    subtotal: number,
    promotion: any,
    orderItems?: Array<{ unitPrice: number | string; quantity: number }>,
  ) {
    const scope: string = (promotion as any).discountScope ?? 'ALL_ITEMS';

    let base = subtotal;
    if (scope === 'FIRST_ITEM' && orderItems && orderItems.length > 0) {
      // Find the item with the highest individual unit price
      const mostExpensive = orderItems.reduce(
        (best, item) => (Number(item.unitPrice) > Number(best.unitPrice) ? item : best),
        orderItems[0],
      );
      base = Number(mostExpensive.unitPrice); // discount off the unit price of that item
    }

    let discountAmount = 0;
    if (promotion.type === 'PERCENTAGE') {
      discountAmount = (base * Number(promotion.value)) / 100;
      if (promotion.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(promotion.maxDiscount));
      }
    } else {
      discountAmount = Math.min(Number(promotion.value), base);
    }

    discountAmount = Math.min(discountAmount, subtotal); // never exceed full order value
    const finalTotal = Number((subtotal - discountAmount).toFixed(2));
    return { discountAmount: Number(discountAmount.toFixed(2)), finalTotal };
  }

  async findById(id: string) {
    return this.prisma.promotion.findUnique({ where: { id } });
  }

  async recordUsage(promotionId: string, discountAmount: number) {
    await this.prisma.promotion.update({
      where: { id: promotionId },
      data: {
        usageCount: { increment: 1 },
        totalDiscount: { increment: discountAmount },
      },
    });
  }
}
