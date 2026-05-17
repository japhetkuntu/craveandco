import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialOrderDto } from './dto/special-orders.dto';

const ITEM_INCLUDE = true;

@Injectable()
export class SpecialOrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSpecialOrderDto, branchId: string, userId: string) {
    return this.prisma.specialOrder.create({
      data: {
        branchId,
        createdBy: userId,
        customerName: dto.customerName,
        notes: dto.notes,
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
      include: { items: true, user: { select: { id: true, name: true } } },
    });
  }

  async findAll(branchId: string, page = 0, limit = 20, status?: string) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.specialOrder.findMany({
      where: {
        branchId,
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async findOne(id: string, branchId: string) {
    const order = await this.prisma.specialOrder.findFirst({
      where: { id, branchId },
      include: { items: true, user: { select: { id: true, name: true } } },
    });
    if (!order) throw new NotFoundException('Special order not found');
    return order;
  }

  async updateStatus(id: string, branchId: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED') {
    const order = await this.prisma.specialOrder.findFirst({ where: { id, branchId } });
    if (!order) throw new NotFoundException('Special order not found');
    return this.prisma.specialOrder.update({
      where: { id },
      data: { status },
      include: { items: true, user: { select: { id: true, name: true } } },
    });
  }
}
