import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(branchId: string, date?: string, from?: string, to?: string) {
    const cleanFrom = from?.trim();
    const cleanTo = to?.trim();
    let start: Date;
    let end: Date;

    if (cleanFrom && cleanTo) {
      start = new Date(cleanFrom);
      end = new Date(cleanTo);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException('Invalid from/to dates');
      }
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
    } else if (date?.trim()) {
      start = new Date(date.trim());
      if (Number.isNaN(start.getTime())) {
        throw new BadRequestException('Invalid date');
      }
      end = new Date(start);
      end.setDate(end.getDate() + 1);
    } else {
      throw new BadRequestException('date or from/to is required');
    }

    const [sales, orderCount, topItems, expenses] = await Promise.all([
      this.prisma.order.aggregate({
        where: { branchId, createdAt: { gte: start, lt: end }, status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { branchId, createdAt: { gte: start, lt: end }, status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: { order: { branchId, createdAt: { gte: start, lt: end } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      this.prisma.expense.aggregate({
        where: { branchId, paidAt: { gte: start, lt: end }, approved: true },
        _sum: { amount: true },
      }),
    ]);

    // Enrich top items with names
    const itemIds = topItems.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
    });

    const totalSales = Number(sales._sum?.total || 0);
    const totalExpenses = Number(expenses._sum?.amount || 0);

    const grossProfit = totalSales - totalExpenses;
    return {
      date,
      totalSales,
      orderCount,
      averageTicket: orderCount > 0 ? Math.round((totalSales / orderCount) * 100) / 100 : 0,
      totalExpenses,
      grossProfit,
      grossMarginPercent: totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0,
      expenseRatioPercent: totalSales > 0 ? Math.round((totalExpenses / totalSales) * 100) : 0,
      topItems: topItems.map((t) => ({
        menuItem: menuItems.find((m) => m.id === t.menuItemId),
        totalQuantity: t._sum?.quantity || 0,
      })),
    };
  }

  async getWeeklyReport(branchId: string, weekStart: string) {
    if (!weekStart) {
      throw new BadRequestException('weekStart is required');
    }

    const start = new Date(weekStart);
    if (Number.isNaN(start.getTime())) {
      throw new BadRequestException('Invalid weekStart date');
    }

    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: start, lt: end },
        status: { not: OrderStatus.CANCELLED },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        branchId,
        paidAt: { gte: start, lt: end },
        approved: true,
      },
      select: {
        amount: true,
        paidAt: true,
      },
    });

    const ordersMap = new Map<string, { totalSales: number; orderCount: number }>();
    orders.forEach((order) => {
      const day = order.createdAt.toISOString().split('T')[0];
      const existing = ordersMap.get(day);
      const total = Number(order.total);
      ordersMap.set(day, {
        totalSales: (existing?.totalSales ?? 0) + total,
        orderCount: (existing?.orderCount ?? 0) + 1,
      });
    });

    const expensesMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const day = expense.paidAt.toISOString().split('T')[0];
      expensesMap.set(day, (expensesMap.get(day) ?? 0) + Number(expense.amount));
    });

    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(start);
      date.setDate(date.getDate() + index);
      const dayKey = date.toISOString().split('T')[0];
      const orderRow = ordersMap.get(dayKey);
      const daySales = orderRow?.totalSales ?? 0;
      const dayOrders = orderRow?.orderCount ?? 0;
      const dayExpenses = expensesMap.get(dayKey) ?? 0;
      return {
        date: dayKey,
        totalSales: daySales,
        orderCount: dayOrders,
        totalExpenses: dayExpenses,
        grossProfit: daySales - dayExpenses,
        averageTicket: dayOrders > 0 ? Math.round((daySales / dayOrders) * 100) / 100 : 0,
      };
    });

    const totalSales = days.reduce((sum, day) => sum + day.totalSales, 0);
    const totalOrders = days.reduce((sum, day) => sum + day.orderCount, 0);
    const totalExpenses = days.reduce((sum, day) => sum + day.totalExpenses, 0);

    return {
      weekStart,
      totalSales,
      totalOrders,
      totalExpenses,
      grossProfit: totalSales - totalExpenses,
      days,
    };
  }

  async getSummary(branchId: string, period: 'day' | 'week' | 'month' | 'year' | 'custom' = 'day', date?: string, from?: string, to?: string) {
    const cleanFrom = from?.trim();
    const cleanTo = to?.trim();
    let start: Date;
    let end: Date;

    if (cleanFrom && cleanTo) {
      start = new Date(cleanFrom);
      end = new Date(cleanTo);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        throw new BadRequestException('Invalid from/to dates');
      }
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + 1);
      period = 'custom';
    } else {
      if (period === 'custom') {
        throw new BadRequestException('Custom period requires from/to dates');
      }
      if (!period || !date?.trim()) {
        throw new BadRequestException('period and date are required');
      }

      const targetDate = new Date(date.trim());
      if (Number.isNaN(targetDate.getTime())) {
        throw new BadRequestException('Invalid date');
      }

      const range = this.getRangeForPeriod(period, targetDate);
      start = range.start;
      end = range.end;
    }

    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        createdAt: { gte: start, lt: end },
        status: { not: OrderStatus.CANCELLED },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    const expenses = await this.prisma.expense.findMany({
      where: {
        branchId,
        paidAt: { gte: start, lt: end },
        approved: true,
      },
      select: {
        amount: true,
        paidAt: true,
      },
    });

    const ordersMap = new Map<string, { totalSales: number; orderCount: number }>();
    orders.forEach((order) => {
      const key = this.getPeriodKey(order.createdAt, period);
      const existing = ordersMap.get(key);
      const total = Number(order.total);
      ordersMap.set(key, {
        totalSales: (existing?.totalSales ?? 0) + total,
        orderCount: (existing?.orderCount ?? 0) + 1,
      });
    });

    const expensesMap = new Map<string, number>();
    expenses.forEach((expense) => {
      const key = this.getPeriodKey(expense.paidAt, period);
      expensesMap.set(key, (expensesMap.get(key) ?? 0) + Number(expense.amount));
    });

    const periods = this.buildPeriodKeys(period, start, end);
    const days = periods.map((periodKey) => {
      const orderRow = ordersMap.get(periodKey);
      const daySales = orderRow?.totalSales ?? 0;
      const dayOrders = orderRow?.orderCount ?? 0;
      const dayExpenses = expensesMap.get(periodKey) ?? 0;
      return {
        date: periodKey,
        totalSales: daySales,
        orderCount: dayOrders,
        totalExpenses: dayExpenses,
        grossProfit: daySales - dayExpenses,
        averageTicket: dayOrders > 0 ? Math.round((daySales / dayOrders) * 100) / 100 : 0,
      };
    });

    const totalSales = days.reduce((sum, day) => sum + day.totalSales, 0);
    const totalOrders = days.reduce((sum, day) => sum + day.orderCount, 0);
    const totalExpenses = days.reduce((sum, day) => sum + day.totalExpenses, 0);

    return {
      periodStart: from || date,
      period,
      totalSales,
      totalOrders,
      totalExpenses,
      grossProfit: totalSales - totalExpenses,
      days,
    };
  }

  private getRangeForPeriod(period: 'day' | 'week' | 'month' | 'year', date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    let end = new Date(start);

    switch (period) {
      case 'day':
        end.setDate(end.getDate() + 1);
        break;
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(end.getDate() + 7);
        break;
      case 'month':
        start.setDate(1);
        end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
        break;
      case 'year':
        start.setMonth(0, 1);
        end = new Date(start.getFullYear() + 1, 0, 1);
        break;
      default:
        throw new BadRequestException('Unsupported period');
    }

    return { start, end };
  }

  private getPeriodKey(date: Date, period: 'day' | 'week' | 'month' | 'year' | 'custom') {
    const d = new Date(date);
    if (period === 'year') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    return d.toISOString().split('T')[0];
  }

  private buildPeriodKeys(period: 'day' | 'week' | 'month' | 'year' | 'custom', start: Date, end?: Date) {
    const keys: string[] = [];
    const date = new Date(start);

    if (period === 'custom') {
      if (!end) {
        throw new BadRequestException('Custom range requires an end date');
      }
      const cursor = new Date(start);
      while (cursor < end) {
        keys.push(cursor.toISOString().split('T')[0]);
        cursor.setDate(cursor.getDate() + 1);
      }
      return keys;
    }

    if (period === 'year') {
      for (let month = 0; month < 12; month += 1) {
        const keyDate = new Date(start.getFullYear(), month, 1);
        keys.push(keyDate.toISOString().split('T')[0]);
      }
      return keys;
    }

    const length = period === 'month'
      ? new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
      : period === 'week'
        ? 7
        : 1;

    for (let index = 0; index < length; index += 1) {
      const keyDate = new Date(start);
      keyDate.setDate(start.getDate() + index);
      keys.push(keyDate.toISOString().split('T')[0]);
    }

    return keys;
  }

  async getMenuProfitability(branchId: string, from: string, to: string) {
    const items = await this.prisma.menuItem.findMany({
      where: { branchId },
      include: {
        recipeItems: { include: { ingredient: true } },
        orderItems: {
          where: {
            order: {
              createdAt: { gte: new Date(from), lte: new Date(to) },
              status: { not: OrderStatus.CANCELLED },
            },
          },
          include: { ingredientCosts: true },
        },
      },
    });

    return items.map((item) => {
      const totalSold = item.orderItems.reduce((s, oi) => s + oi.quantity, 0);
      const totalCost = item.orderItems.reduce(
        (sum, oi) => sum + Number(oi.unitCost) * oi.quantity,
        0,
      );
      const ingredientTotals = item.orderItems.reduce((totals, oi) => {
        oi.ingredientCosts?.forEach((cost) => {
          const key = `${cost.ingredientId}:${cost.ingredientName}`;
          totals[key] = totals[key] || { ingredientName: cost.ingredientName, totalCost: 0 };
          totals[key].totalCost += Number(cost.totalCost) * oi.quantity;
        });
        return totals;
      }, {} as Record<string, { ingredientName: string; totalCost: number }>);

      const ingredientBreakdown = Object.values(ingredientTotals)
        .map((breakdown) => ({
          ...breakdown,
          totalCost: Math.round(breakdown.totalCost * 100) / 100,
        }))
        .sort((a, b) => b.totalCost - a.totalCost);

      const foodCostPerUnit = totalSold > 0 ? totalCost / totalSold : 0;
      const revenue = totalSold * Number(item.price);
      return {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        foodCost: Math.round(foodCostPerUnit * 100) / 100,
        marginPercent: Number(item.price) > 0 ? Math.round(((Number(item.price) - foodCostPerUnit) / Number(item.price)) * 100) : 0,
        totalSold,
        revenue,
        totalCost,
        grossProfit: revenue - totalCost,
        ingredientBreakdown,
      };
    });
  }
}
