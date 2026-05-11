import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/promotions.dto';
import { PromotionStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePromotionDto, branchId: string) {
    if (dto.type === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }
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
      },
    });
  }

  async findAll(branchId: string) {
    return this.prisma.promotion.findMany({
      where: { branchId },
      orderBy: { createdAt: 'desc' },
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
   * Calculate the discount amount for an order total given a promotion.
   * Returns { discountAmount, finalTotal }
   */
  calculateDiscount(promotionId: string, subtotal: number, promotion: any) {
    let discountAmount = 0;
    if (promotion.type === 'PERCENTAGE') {
      discountAmount = (subtotal * Number(promotion.value)) / 100;
      if (promotion.maxDiscount) {
        discountAmount = Math.min(discountAmount, Number(promotion.maxDiscount));
      }
    } else {
      discountAmount = Number(promotion.value);
    }
    discountAmount = Math.min(discountAmount, subtotal);
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
