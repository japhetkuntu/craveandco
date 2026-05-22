import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { UpsertEngagementDto } from './dto/engagement.dto';

@Injectable()
export class EngagementService {
  constructor(private prisma: PrismaService) {}

  /** Upsert an engagement log for a customer on a given date */
  async upsertLog(
    branchId: string,
    customerId: string,
    engagedById: string,
    dto: UpsertEngagementDto,
  ) {
    const dateOnly = new Date(dto.date);
    dateOnly.setHours(0, 0, 0, 0);

    return this.prisma.customerEngagementLog.upsert({
      where: { customerId_date: { customerId, date: dateOnly } },
      create: {
        branch: { connect: { id: branchId } },
        customer: { connect: { id: customerId } },
        engagedBy: { connect: { id: engagedById } },
        date: dateOnly,
        engaged: dto.engaged,
        reached: dto.reached ?? null,
        engagedAt: dto.engagedAt ? new Date(dto.engagedAt) : null,
        channel: dto.channel ?? null,
        notes: dto.notes ?? null,
      },
      update: {
        engagedBy: { connect: { id: engagedById } },
        engaged: dto.engaged,
        reached: dto.reached ?? null,
        engagedAt: dto.engagedAt ? new Date(dto.engagedAt) : null,
        channel: dto.channel ?? null,
        notes: dto.notes ?? null,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        engagedBy: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Get the engagement list for a date.
   * Returns all customers (paginated) with their log for the given date
   * and whether they placed a COMPLETED order that day.
   */
  async getDailyList(
    branchId: string,
    date: string,
    page: number,
    limit: number,
    search?: string,
  ) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateOnly);
    nextDay.setDate(nextDay.getDate() + 1);

    const skip = page * limit;

    const customerWhere: Record<string, unknown> = {};
    if (search) {
      customerWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, customers] = await Promise.all([
      this.prisma.customer.count({ where: customerWhere }),
      this.prisma.customer.findMany({
        where: customerWhere,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          totalSpend: true,
          visitCount: true,
          lastSeenAt: true,
          engagementLogs: {
            where: { date: dateOnly },
            take: 1,
            include: { engagedBy: { select: { id: true, name: true } } },
          },
          orders: {
            where: {
              branchId,
              status: OrderStatus.COMPLETED,
              createdAt: { gte: dateOnly, lt: nextDay },
            },
            take: 1,
            select: { id: true, total: true, createdAt: true },
          },
        },
      }),
    ]);

    const items = customers.map((c) => {
      const log = c.engagementLogs[0] ?? null;
      const order = c.orders[0] ?? null;
      return {
        customer: {
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          totalSpend: c.totalSpend,
          visitCount: c.visitCount,
          lastSeenAt: c.lastSeenAt,
        },
        log: log
          ? {
              id: log.id,
              engaged: log.engaged,
              reached: log.reached,
              engagedAt: log.engagedAt,
              channel: log.channel,
              notes: log.notes,
              engagedBy: log.engagedBy,
            }
          : null,
        orderedToday: order !== null,
        order: order
          ? { id: order.id, total: order.total, createdAt: order.createdAt }
          : null,
      };
    });

    // Not-engaged (no log, or log.engaged=false) first; within each group alphabetically
    items.sort((a, b) => {
      const aEngaged = a.log?.engaged ?? false;
      const bEngaged = b.log?.engaged ?? false;
      if (aEngaged !== bEngaged) return aEngaged ? 1 : -1;
      return a.customer.name.localeCompare(b.customer.name);
    });

    return {
      data: items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /** Owner analytics — engagement & conversion metrics over a date range */
  async getAnalytics(branchId: string, from: string, to: string) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);

    const logs = await this.prisma.customerEngagementLog.findMany({
      where: { branchId, date: { gte: start, lt: end } },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        engagedBy: { select: { id: true, name: true } },
      },
    });

    const totalCustomers = await this.prisma.customer.count();

    // For each engagement log that is "engaged", check if the customer ordered that day
    const engagedLogs = logs.filter((l) => l.engaged);

    // Batch fetch orders for engaged customers on engagement dates
    const orderChecks = await Promise.all(
      engagedLogs.map(async (log) => {
        const dayStart = new Date(log.date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const order = await this.prisma.order.findFirst({
          where: {
            branchId,
            customerId: log.customerId,
            status: OrderStatus.COMPLETED,
            createdAt: { gte: dayStart, lt: dayEnd },
          },
          select: { id: true, total: true },
        });
        return { logId: log.id, ordered: order !== null, order };
      }),
    );

    const orderedSet = new Set(
      orderChecks.filter((o) => o.ordered).map((o) => o.logId),
    );

    const totalLogs = logs.length;
    const totalEngaged = engagedLogs.length;
    const totalConverted = orderedSet.size;
    const totalReached = engagedLogs.filter((l) => l.reached === true).length;
    const uniqueLoggedCustomers = new Set(logs.map((l) => l.customerId)).size;

    // Daily breakdown
    const dailyMap = new Map<string, { date: string; engaged: number; total: number; converted: number }>();
    for (const log of logs) {
      const key = log.date.toISOString().split('T')[0];
      if (!dailyMap.has(key)) {
        dailyMap.set(key, { date: key, engaged: 0, total: 0, converted: 0 });
      }
      const day = dailyMap.get(key)!;
      day.total++;
      if (log.engaged) {
        day.engaged++;
        if (orderedSet.has(log.id)) day.converted++;
      }
    }

    const dailyTrend = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    // Top engagers (by number of engagements done)
    const engagerMap = new Map<string, { name: string; engaged: number; converted: number }>();
    for (const log of engagedLogs) {
      const key = log.engagedById;
      if (!engagerMap.has(key)) {
        engagerMap.set(key, { name: log.engagedBy.name, engaged: 0, converted: 0 });
      }
      const e = engagerMap.get(key)!;
      e.engaged++;
      if (orderedSet.has(log.id)) e.converted++;
    }

    const topEngagers = Array.from(engagerMap.entries())
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.engaged - a.engaged)
      .slice(0, 10);

    // Channel breakdown
    const channelMap = new Map<string, number>();
    for (const log of engagedLogs) {
      const ch = log.channel ?? 'UNKNOWN';
      channelMap.set(ch, (channelMap.get(ch) ?? 0) + 1);
    }
    const channelBreakdown = Array.from(channelMap.entries()).map(([channel, count]) => ({
      channel,
      count,
    }));

    // Recent engagement activity (last 20 logs)
    const recentLogs = logs
      .sort((a, b) => (b.engagedAt ?? b.createdAt) > (a.engagedAt ?? a.createdAt) ? 1 : -1)
      .slice(0, 20)
      .map((log) => ({
        id: log.id,
        customer: log.customer,
        engagedBy: log.engagedBy,
        date: log.date.toISOString().split('T')[0],
        engaged: log.engaged,
        reached: log.reached,
        engagedAt: log.engagedAt,
        channel: log.channel,
        notes: log.notes,
        orderedToday: orderedSet.has(log.id),
      }));

    return {
      summary: {
        totalCustomers,
        totalUniqueLogged: uniqueLoggedCustomers,
        totalNotLogged: Math.max(0, totalCustomers - uniqueLoggedCustomers),
        totalLogged: totalLogs,
        totalEngaged,
        totalReached,
        totalConverted,
        engagementRate: totalLogs > 0 ? Math.round((totalEngaged / totalLogs) * 100) : 0,
        reachRate: totalEngaged > 0 ? Math.round((totalReached / totalEngaged) * 100) : 0,
        conversionRate: totalEngaged > 0 ? Math.round((totalConverted / totalEngaged) * 100) : 0,
      },
      dailyTrend,
      topEngagers,
      channelBreakdown,
      recentActivity: recentLogs,
    };
  }

  /** Get a single day's summary counts — used by owner dashboard widget */
  async getDailySummary(branchId: string, date: string) {
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateOnly);
    nextDay.setDate(nextDay.getDate() + 1);

    const [total, engaged, converted, totalCustomers] = await Promise.all([
      this.prisma.customerEngagementLog.count({ where: { branchId, date: dateOnly } }),
      this.prisma.customerEngagementLog.count({ where: { branchId, date: dateOnly, engaged: true } }),
      this.prisma.customerEngagementLog.count({
        where: {
          branchId,
          date: dateOnly,
          engaged: true,
          customer: {
            orders: {
              some: {
                branchId,
                status: OrderStatus.COMPLETED,
                createdAt: { gte: dateOnly, lt: nextDay },
              },
            },
          },
        },
      }),
      this.prisma.customer.count(),
    ]);

    return {
      date,
      totalCustomers,
      totalLogged: total,
      totalNotLogged: Math.max(0, totalCustomers - total),
      totalEngaged: engaged,
      totalNotEngaged: Math.max(0, total - engaged),
      totalConverted: converted,
      engagementRate: total > 0 ? Math.round((engaged / total) * 100) : 0,
      conversionRate: engaged > 0 ? Math.round((converted / engaged) * 100) : 0,
      coverageRate: totalCustomers > 0 ? Math.round((total / totalCustomers) * 100) : 0,
    };
  }
}
