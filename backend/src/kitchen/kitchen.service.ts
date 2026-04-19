import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AlertSeverity, OrderStatus } from '@prisma/client';
import { AlertsService } from '../alerts/alerts.service';
import { CreateHandoverNoteDto } from './dto/kitchen.dto';

@Injectable()
export class KitchenService {
  constructor(private prisma: PrismaService, private alerts: AlertsService) {}

  async getLiveOrders(branchId: string, station?: string, page = 0, limit = 50) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.order.findMany({
      where: {
        branchId,
        status: { in: [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY] },
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

  private isValidOrderStatus(status: string): status is OrderStatus {
    return Object.values(OrderStatus).includes(status as OrderStatus);
  }

  async updateOrderStatus(orderId: string, status: string) {
    if (!this.isValidOrderStatus(status)) {
      throw new BadRequestException(`Invalid order status: ${status}`);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: { include: { menuItem: true } } },
    });
  }

  async getPrepList(branchId: string, date: string, shift?: string, page = 0, limit = 50) {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: targetDate, lt: nextDate },
        status: { in: [OrderStatus.NEW, OrderStatus.PREPARING] },
      },
      include: { items: { include: { menuItem: true } } },
    });
    const map: Record<string, { menuItemId: string; menuItem: string; totalQuantity: number }> = {};
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

  async createShortageRequest(ingredientId: string, branchId: string, reason?: string) {
    const movement = await this.prisma.inventoryMovement.create({
      data: {
        ingredientId,
        branchId,
        type: 'ADJUSTMENT',
        quantity: 0,
        reason: reason || 'Shortage reported from kitchen',
      },
    });

    await this.alerts.createAlert(
      branchId,
      'SHORTAGE_REQUEST',
      AlertSeverity.WARNING,
      reason || `Shortage request created for ingredient ${ingredientId}`,
    );

    return movement;
  }

  async logWaste(ingredientId: string, branchId: string, quantity: number, reason?: string) {
    const normalizedQuantity = Math.abs(Number(quantity));
    if (!normalizedQuantity || Number.isNaN(normalizedQuantity)) {
      throw new BadRequestException('Waste quantity must be greater than zero');
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

  async getWasteLogs(branchId: string, page = 0, limit = 50) {
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

  async getHandoverNotes(date?: string, shift?: string, page = 0, limit = 50) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.handoverNote.findMany({
      where: {
        date: targetDate,
        ...(shift && { shift: shift as any }),
      },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async createHandoverNote(userId: string, dto: CreateHandoverNoteDto) {
    return this.prisma.handoverNote.create({
      data: {
        userId,
        shift: dto.shift,
        date: new Date(),
        content: dto.content,
      },
    });
  }

  async getStationLoad(branchId: string, page = 0, limit = 50) {
    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        status: { in: [OrderStatus.NEW, OrderStatus.PREPARING] },
      },
      include: { items: { include: { menuItem: { include: { category: true } } } } },
    });
    // Group by category as a proxy for station
    const stationMap: Record<string, number> = {};
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
}
