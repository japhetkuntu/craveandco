import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialOrderDto, CreateDraftSpecialOrderDto, UpdateSpecialOrderItemPricesDto } from './dto/special-orders.dto';

const USER_SELECT = { select: { id: true, name: true } };

@Injectable()
export class SpecialOrdersService {
  constructor(private prisma: PrismaService) {}

  private computePricingMetrics(items: Array<{ quantity: number; costPrice: number; sellPrice: number }>) {
    const revenue = items.reduce((sum, item) => sum + Number(item.sellPrice) * Number(item.quantity), 0);
    const cost = items.reduce((sum, item) => sum + Number(item.costPrice) * Number(item.quantity), 0);
    const profit = revenue - cost;
    const marginPercent = revenue > 0 ? (profit / revenue) * 100 : 0;
    return {
      revenue,
      cost,
      profit,
      marginPercent,
      isProfitable: profit >= 0,
    };
  }

  previewPricing(items: Array<{ quantity: number; costPrice: number; sellPrice: number }>) {
    if (!items.length) {
      throw new BadRequestException('At least one item is required to preview pricing.');
    }
    return this.computePricingMetrics(items);
  }

  // Ops / Owner: create with prices immediately
  async create(dto: CreateSpecialOrderDto, branchId: string, userId: string) {
    const metrics = this.computePricingMetrics(dto.items);
    if (!metrics.isProfitable) {
      throw new BadRequestException('Special order cannot be created at a loss. Update pricing first.');
    }

    return this.prisma.specialOrder.create({
      data: {
        branchId,
        createdBy: userId,
        customerName: dto.customerName,
        notes: dto.notes,
        status: 'PENDING',
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            costPrice: item.costPrice,
            sellPrice: item.sellPrice,
          })),
        },
      },
      include: { items: true, user: USER_SELECT },
    });
  }

  // Growth Lead: create draft without prices
  async createDraft(dto: CreateDraftSpecialOrderDto, branchId: string, userId: string) {
    return this.prisma.specialOrder.create({
      data: {
        branchId,
        createdBy: userId,
        customerName: dto.customerName,
        notes: dto.notes,
        status: 'DRAFT',
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            costPrice: 0,
            sellPrice: 0,
          })),
        },
      },
      include: { items: true, user: USER_SELECT },
    });
  }

  async findAll(branchId: string, page = 0, limit = 20, status?: string, from?: string, to?: string) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = Math.max(page, 0) * take;
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(0, 0, 0, 0);
      toDate.setDate(toDate.getDate() + 1);
      createdAt.lt = toDate;
    }
    return this.prisma.specialOrder.findMany({
      where: {
        branchId,
        ...(status ? { status: status as any } : {}),
        ...(Object.keys(createdAt).length ? { createdAt } : {}),
      },
      include: { items: true, user: USER_SELECT },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  // Growth Lead: their own orders, prices stripped
  async findMine(branchId: string, userId: string, page = 0, limit = 20) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = Math.max(page, 0) * take;
    const orders = await this.prisma.specialOrder.findMany({
      where: { branchId, createdBy: userId },
      include: { items: true, user: USER_SELECT },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return orders.map((o) => ({
      ...o,
      items: o.items.map(({ costPrice: _c, sellPrice: _s, ...item }) => item),
    }));
  }

  async findOne(id: string, branchId: string) {
    const order = await this.prisma.specialOrder.findFirst({
      where: { id, branchId },
      include: { items: true, user: USER_SELECT },
    });
    if (!order) throw new NotFoundException('Special order not found');
    return order;
  }

  // Ops / Owner: set prices on a DRAFT order's items
  async updateItemPrices(id: string, branchId: string, dto: UpdateSpecialOrderItemPricesDto) {
    const order = await this.prisma.specialOrder.findFirst({ where: { id, branchId } });
    if (!order) throw new NotFoundException('Special order not found');
    if (order.status !== 'DRAFT') throw new BadRequestException('Only DRAFT orders can have prices updated');

    await Promise.all(
      dto.items.map((item) =>
        this.prisma.specialOrderItem.update({
          where: { id: item.id },
          data: { costPrice: item.costPrice, sellPrice: item.sellPrice },
        }),
      ),
    );
    return this.findOne(id, branchId);
  }

  // Ops / Owner: approve a draft (DRAFT → PENDING)
  async approve(id: string, branchId: string) {
    const order = await this.prisma.specialOrder.findFirst({
      where: { id, branchId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Special order not found');
    if (order.status !== 'DRAFT') throw new BadRequestException('Only DRAFT orders can be approved');
    const allPriced = order.items.every((i) => Number(i.sellPrice) > 0);
    if (!allPriced) throw new BadRequestException('All items must have a sell price before approving');
    const metrics = this.computePricingMetrics(
      order.items.map((item) => ({
        quantity: Number(item.quantity),
        costPrice: Number(item.costPrice),
        sellPrice: Number(item.sellPrice),
      })),
    );
    if (!metrics.isProfitable) {
      throw new BadRequestException('Special order cannot be approved at a loss. Update item pricing first.');
    }

    return this.prisma.specialOrder.update({
      where: { id },
      data: { status: 'PENDING' },
      include: { items: true, user: USER_SELECT },
    });
  }

  async updateStatus(id: string, branchId: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED') {
    const order = await this.prisma.specialOrder.findFirst({ where: { id, branchId } });
    if (!order) throw new NotFoundException('Special order not found');
    return this.prisma.specialOrder.update({
      where: { id },
      data: { status },
      include: { items: true, user: USER_SELECT },
    });
  }
}
