import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class GrowthService {
  constructor(
    private prisma: PrismaService,
    private customers: CustomersService,
  ) {}

  private normalizeRange(from: string, to: string) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  async getDashboard(branchId: string, from: string, to: string) {
    const customerDashboard = await this.customers.getDashboard();
    const { start, end } = this.normalizeRange(from, to);
    const campaigns = await this.prisma.campaign.findMany({
      where: { launchedAt: { gte: start, lt: end } },
      orderBy: { launchedAt: 'desc' },
      take: 5,
    });

    const dateFilter = { createdAt: { gte: start, lt: end } };
    const [earned, redeemed, customerSpend, customerVisits, ordersProcessed, ordersWithItems] = await Promise.all([
      this.prisma.loyaltyTransaction.aggregate({
        where: { ...dateFilter, type: 'EARN' },
        _sum: { points: true },
      }),
      this.prisma.loyaltyTransaction.aggregate({
        where: { ...dateFilter, type: 'REDEEM' },
        _sum: { points: true },
      }),
      this.prisma.order.aggregate({
        where: { branchId, ...dateFilter, customerId: { not: null }, status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
      this.prisma.order.count({
        where: { branchId, ...dateFilter, customerId: { not: null }, status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.order.count({
        where: { branchId, ...dateFilter, status: { not: OrderStatus.CANCELLED } },
      }),
      this.prisma.order.findMany({
        where: { branchId, ...dateFilter, status: { not: OrderStatus.CANCELLED } },
        include: { items: { select: { quantity: true, unitPrice: true } } },
      }),
    ]);

    const totalDiscounts = ordersWithItems.reduce((sum, order) => {
      const subtotal = order.items.reduce((itemSum, item) => itemSum + Number(item.unitPrice) * item.quantity, 0);
      return sum + Math.max(subtotal - Number(order.total), 0);
    }, 0);

    const trendMap: Record<string, { orders: number; revenue: number; visits: number }> = {};
    for (const order of ordersWithItems) {
      const date = order.createdAt.toISOString().slice(0, 10);
      if (!trendMap[date]) {
        trendMap[date] = { orders: 0, revenue: 0, visits: 0 };
      }
      trendMap[date].orders += 1;
      trendMap[date].revenue += Number(order.total);
      if (order.customerId) trendMap[date].visits += 1;
    }

    const orderSeries: Array<{ date: string; orders: number; revenue: number; visits: number }> = [];
    for (const date = new Date(start); date < end; date.setDate(date.getDate() + 1)) {
      const key = date.toISOString().slice(0, 10);
      const bucket = trendMap[key] || { orders: 0, revenue: 0, visits: 0 };
      orderSeries.push({ date: key, ...bucket });
    }

    return {
      customers: customerDashboard,
      loyalty: {
        totalPointsIssued: earned._sum?.points || 0,
        totalPointsRedeemed: Math.abs(redeemed._sum?.points || 0),
        totalDiscounts,
      },
      campaigns,
      customerSpend: Number(customerSpend._sum?.total || 0),
      customerVisits,
      ordersProcessed,
      orderSeries,
    };
  }

  async getChurnRisk() {
    return this.customers.getChurnRisk();
  }

  async getPaymentTypes(branchId: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.paymentType.findMany({
      where: { branchId, active: true },
      orderBy: { createdAt: 'asc' },
      take,
      skip,
    });
  }
}
