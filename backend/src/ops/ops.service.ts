import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PurchaseOrderStatus } from '@prisma/client';

@Injectable()
export class OpsService {
  constructor(private prisma: PrismaService) {}

  private parseRange(from?: string, to?: string, date?: string) {
    if (from && to) {
      const start = new Date(from);
      const end = new Date(to);
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    const targetDate = new Date(date ?? new Date().toISOString().split('T')[0]);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return { start: targetDate, end: nextDate };
  }

  private parseChecklistHistoryRange(from?: string, to?: string) {
    const end = to ? new Date(to) : new Date();
    end.setHours(0, 0, 0, 0);
    const start = from ? new Date(from) : new Date(end);
    if (!from) {
      start.setDate(end.getDate() - 6);
    }
    start.setHours(0, 0, 0, 0);
    const nextDate = new Date(end);
    nextDate.setDate(nextDate.getDate() + 1);
    return { start, end: nextDate };
  }

  private getChecklistStats(lists: Record<string, any> = {}) {
    let completed = 0;
    let total = 0;

    Object.values(lists).forEach((items) => {
      if (!Array.isArray(items)) return;
      items.forEach((item) => {
        if (item && typeof item === 'object' && typeof item.checked === 'boolean') {
          if (item.checked) completed += 1;
          total += 1;
        }
      });
    });

    return {
      completed,
      total,
      completion: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  async getCommandCenter(branchId: string, from?: string, to?: string, date?: string) {
    const { start: targetDate, end: nextDate } = this.parseRange(from, to, date);

    const [activeOrders, completedOrders, openAlerts, customerOrders, customerRevenue, totalRevenue, pendingPurchaseOrders, inventoryMovements, ingredients] = await Promise.all([
      this.prisma.order.count({
        where: { branchId, status: { in: [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY] } },
      }),
      this.prisma.order.count({
        where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: OrderStatus.COMPLETED },
      }),
      this.prisma.alert.count({
        where: { branchId, status: 'OPEN' },
      }),
      this.prisma.order.count({
        where: {
          branchId,
          createdAt: { gte: targetDate, lt: nextDate },
          status: { not: OrderStatus.CANCELLED },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          branchId,
          createdAt: { gte: targetDate, lt: nextDate },
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          branchId,
          createdAt: { gte: targetDate, lt: nextDate },
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { total: true },
      }),
      this.prisma.purchaseOrder.count({
        where: { branchId, status: { in: [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.SENT, PurchaseOrderStatus.PARTIALLY_RECEIVED] } },
      }),
      this.prisma.inventoryMovement.groupBy({
        by: ['ingredientId'],
        where: { branchId },
        _sum: { quantity: true },
      }),
      this.prisma.ingredient.findMany({
        select: { id: true, name: true, reorderLevel: true },
      }),
    ]);

    const movementMap = new Map(inventoryMovements.map((m) => [m.ingredientId, Number(m._sum?.quantity ?? 0)]));
    const lowStockItems = ingredients
      .map((ingredient) => {
        const onHand = Number(movementMap.get(ingredient.id) ?? 0);
        return {
          name: ingredient.name,
          onHand,
          reorderLevel: Number(ingredient.reorderLevel),
        };
      })
      .filter((item) => item.onHand < item.reorderLevel);

    const totalOrders = await this.prisma.order.count({
      where: {
        branchId,
        createdAt: { gte: targetDate, lt: nextDate },
        status: { not: OrderStatus.CANCELLED },
      },
    });

    const avgOrderValue = totalOrders > 0 ? Math.round((Number(totalRevenue._sum?.total || 0) / totalOrders) * 100) / 100 : 0;
    const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    const actionItems = [] as string[];
    if (openAlerts > 0) actionItems.push(`Resolve ${openAlerts} open alerts`);
    if (lowStockItems.length > 0) actionItems.push(`Review ${lowStockItems.length} low stock items`);
    if (activeOrders > 0) actionItems.push(`Complete ${activeOrders} active orders`);
    if (pendingPurchaseOrders > 0) actionItems.push(`Process ${pendingPurchaseOrders} purchase orders`);

    return {
      date: from && to ? `${from} to ${to}` : date,
      activeOrders,
      completedOrders,
      totalOrders,
      lowStockCount: lowStockItems.length,
      staffOnDuty: await this.prisma.attendanceLog.count({
        where: { branchId, clockIn: { gte: targetDate, lt: nextDate }, clockOut: null },
      }),
      openAlerts,
      customerOrders,
      customerRevenue: Number(customerRevenue._sum?.total || 0),
      pendingPurchaseOrders,
      avgOrderValue,
      completionRate,
      lowStockPreview: lowStockItems.slice(0, 5),
      actionItems,
    };
  }

  async getServiceTimeline(branchId: string, from?: string, to?: string, date?: string, page = 0, limit = 50) {
    const { start: targetDate, end: nextDate } = this.parseRange(from, to, date);
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;

    return this.prisma.order.findMany({
      where: { branchId, createdAt: { gte: targetDate, lt: nextDate } },
      select: { id: true, channel: true, status: true, total: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async dayClose(branchId: string, closedBy: string, openingFloat = 0, cashCounted = 0, notes?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [sales, expenses, cashSales] = await Promise.all([
      this.prisma.order.aggregate({
        where: { branchId, createdAt: { gte: today, lt: tomorrow }, status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { branchId, paidAt: { gte: today, lt: tomorrow }, approved: true },
        _sum: { amount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          branchId,
          createdAt: { gte: today, lt: tomorrow },
          status: { not: OrderStatus.CANCELLED },
          paymentMethod: 'CASH',
        },
        _sum: { total: true },
      }),
    ]);

    const totalSales = Number(sales._sum?.total || 0);
    const totalExpenses = Number(expenses._sum?.amount || 0);
    const cashSalesAmount = Number(cashSales._sum?.total || 0);
    const expectedCash = cashSalesAmount + openingFloat;
    const variance = cashCounted - expectedCash;

    const record = await this.prisma.auditLog.create({
      data: {
        userId: closedBy,
        branchId,
        action: 'DAY_CLOSE',
        module: 'OPS',
        details: {
          date: today.toISOString().split('T')[0],
          totalSales,
          orderCount: sales._count,
          totalExpenses,
          notes: notes ?? null,
          cashBalance: {
            openingFloat,
            cashSales: cashSalesAmount,
            expectedCash,
            cashCounted,
            variance,
          },
        },
      },
    });

    return {
      date: today.toISOString().split('T')[0],
      totalSales,
      orderCount: sales._count,
      totalExpenses,
      closedBy,
      closedAt: new Date(),
      auditId: record.id,
      cashBalance: {
        openingFloat,
        cashSales: cashSalesAmount,
        expectedCash,
        cashCounted,
        variance,
      },
    };
  }

  async getDayCloseSummary(branchId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const record = await this.prisma.auditLog.findFirst({
      where: {
        branchId,
        module: 'OPS',
        action: 'DAY_CLOSE',
        createdAt: { gte: targetDate, lt: nextDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sales = await this.prisma.order.aggregate({
      where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: { not: OrderStatus.CANCELLED } },
      _sum: { total: true },
      _count: true,
    });

    const expenses = await this.prisma.expense.aggregate({
      where: { branchId, paidAt: { gte: targetDate, lt: nextDate }, approved: true },
      _sum: { amount: true },
    });

    return {
      date: date,
      totalSales: Number(sales._sum?.total || 0),
      orderCount: sales._count,
      totalExpenses: Number(expenses._sum?.amount || 0),
      closed: Boolean(record),
      closedAt: record?.createdAt || null,
      closedBy: record?.userId || null,
      auditId: record?.id || null,
    };
  }

  async getChecklists(branchId: string, date: string, userId?: string) {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const record = await this.prisma.auditLog.findFirst({
      where: {
        branchId,
        module: 'CHECKLIST',
        action: 'SAVE',
        createdAt: { gte: targetDate, lt: nextDate },
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return record?.details || null;
  }

  async getChecklistHistory(branchId: string, userId?: string, role?: string, from?: string, to?: string) {
    const { start, end } = this.parseChecklistHistoryRange(from, to);

    const records = await this.prisma.auditLog.findMany({
      where: {
        branchId,
        module: 'CHECKLIST',
        action: 'SAVE',
        createdAt: { gte: start, lt: end },
        ...(userId ? { userId } : {}),
        ...(role && role !== 'ALL' ? { user: { role: role as any } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, role: true } } },
    });

    const uniqueRecordsByUserDate = new Map<string, typeof records[number]>();
    records.forEach((record) => {
      const details = record.details || {};
      const recordDate = (details as any).date || record.createdAt.toISOString().split('T')[0];
      const key = `${record.userId}:${recordDate}`;
      if (!uniqueRecordsByUserDate.has(key)) {
        uniqueRecordsByUserDate.set(key, record);
      }
    });

    const dailyMap = new Map<string, {
      totalCompletion: number;
      count: number;
      totalItems: number;
      completedItems: number;
    }>();

    const history = Array.from(uniqueRecordsByUserDate.values()).map((record) => {
      const details = record.details || {};
      const lists = (details as any).lists || {};
      const stats = this.getChecklistStats(lists);
      const recordDate = (details as any).date || record.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(recordDate) ?? {
        totalCompletion: 0,
        count: 0,
        totalItems: 0,
        completedItems: 0,
      };
      existing.totalCompletion += stats.completion;
      existing.count += 1;
      existing.totalItems += stats.total;
      existing.completedItems += stats.completed;
      dailyMap.set(recordDate, existing);

      return {
        id: record.id,
        date: recordDate,
        savedAt: record.createdAt,
        user: record.user,
        completion: stats.completion,
        totalItems: stats.total,
        completedItems: stats.completed,
        lists,
      };
    });

    const dailySummaries = [] as Array<{
      date: string;
      checklistCount: number;
      averageCompletion: number;
      totalItems: number;
      completedItems: number;
    }>;

    const current = new Date(start);
    while (current < end) {
      const dateKey = current.toISOString().split('T')[0];
      const entry = dailyMap.get(dateKey);
      dailySummaries.push({
        date: dateKey,
        checklistCount: entry?.count ?? 0,
        averageCompletion: entry ? Math.round(entry.totalCompletion / entry.count) : 0,
        totalItems: entry?.totalItems ?? 0,
        completedItems: entry?.completedItems ?? 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return {
      history,
      dailySummaries,
      range: {
        from: start.toISOString().split('T')[0],
        to: new Date(end).toISOString().split('T')[0],
      },
    };
  }

  async saveChecklists(branchId: string, userId: string, date: string, lists: Record<string, any>) {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const existing = await this.prisma.auditLog.findFirst({
      where: {
        branchId,
        userId,
        module: 'CHECKLIST',
        action: 'SAVE',
        createdAt: { gte: targetDate, lt: nextDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    const details = JSON.parse(JSON.stringify({ date, lists }));

    if (existing) {
      return this.prisma.auditLog.update({
        where: { id: existing.id },
        data: { details },
      });
    }

    return this.prisma.auditLog.create({
      data: {
        userId,
        branchId,
        action: 'SAVE',
        module: 'CHECKLIST',
        details,
      },
    });
  }
}
