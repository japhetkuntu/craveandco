import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, SendSmsDto, UpdateCustomerDto } from './dto/customers.dto';
import { LoyaltyTxType, OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  /** Normalise any Ghana phone format to 0XXXXXXXXX (10 digits). */
  private normalizePhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-().+]/g, '');
    if (cleaned.startsWith('233')) return '0' + cleaned.slice(3);
    if (cleaned.startsWith('0')) return cleaned;
    if (cleaned.length === 9) return '0' + cleaned;
    return cleaned;
  }

  private parseBirthday(birthday?: string | null) {
    if (birthday === undefined) return undefined;
    if (birthday === null) return null;
    const parsed = new Date(birthday);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid birthday format');
    }
    return parsed;
  }

  async create(dto: CreateCustomerDto) {
    const phone = dto.phone ? this.normalizePhone(dto.phone) : undefined;
    if (phone) {
      const existing = await this.prisma.customer.findFirst({ where: { phone } });
      if (existing) throw new BadRequestException('A customer with that phone number already exists.');
    }
    const birthday = this.parseBirthday(dto.birthday);
    try {
      return await this.prisma.customer.create({
        data: {
          name: dto.name,
          phone,
          email: dto.email,
          ...(birthday !== undefined ? { birthday } : {}),
        },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A customer with that phone number already exists.');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const { birthday, phone: rawPhone, ...rest } = dto;
    const phone = rawPhone ? this.normalizePhone(rawPhone) : rawPhone;
    const parsedBirthday = this.parseBirthday(birthday);
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: {
          ...rest,
          ...(phone !== undefined ? { phone } : {}),
          ...(parsedBirthday !== undefined ? { birthday: parsedBirthday } : {}),
        },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A customer with that phone number already exists.');
      }
      throw error;
    }
  }

  async delete(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found.');
    await this.prisma.customer.delete({ where: { id } });
    return { success: true };
  }

  async findAll(params?: {
    segment?: string;
    status?: string;
    hasPhone?: string;
    hasEmail?: string;
    hasBirthday?: string;
    search?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    lastSeenAfter?: string;
    lastSeenBefore?: string;
    addedAfter?: string;
    addedBefore?: string;
    minVisits?: string;
    maxVisits?: string;
    minTotalSpend?: string;
    maxTotalSpend?: string;
    minLoyaltyPoints?: string;
    maxLoyaltyPoints?: string;
    minTotalDiscount?: string;
    maxTotalDiscount?: string;
    page?: number;
    limit?: number;
  }) {
    const take = Math.min(Math.max(params?.limit ?? 50, 1), 100);
    const skip = Math.max(params?.page ?? 0, 0) * take;

    const where: any = {};

    const parseBool = (value?: string) => {
      if (value === undefined) return undefined;
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      return undefined;
    };

    const parseNumber = (value?: string) => {
      if (value === undefined || value === '') return undefined;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const minVisits = parseNumber(params?.minVisits);
    const maxVisits = parseNumber(params?.maxVisits);
    const minTotalSpend = parseNumber(params?.minTotalSpend);
    const maxTotalSpend = parseNumber(params?.maxTotalSpend);
    const minLoyaltyPoints = parseNumber(params?.minLoyaltyPoints);
    const maxLoyaltyPoints = parseNumber(params?.maxLoyaltyPoints);
    const minTotalDiscount = parseNumber(params?.minTotalDiscount);
    const maxTotalDiscount = parseNumber(params?.maxTotalDiscount);

    const hasPhone = parseBool(params?.hasPhone);
    if (hasPhone === true) where.phone = { not: null };
    if (hasPhone === false) where.phone = null;

    const hasEmail = parseBool(params?.hasEmail);
    if (hasEmail === true) where.email = { not: null };
    if (hasEmail === false) where.email = null;

    const hasBirthday = parseBool(params?.hasBirthday);
    if (hasBirthday === true) where.birthday = { not: null };
    if (hasBirthday === false) where.birthday = null;

    if (params?.status) {
      const now = new Date();
      const daysAgo = (n: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n);
        return d;
      };

      const status = params.status.toLowerCase();
      switch (status) {
        case 'never':
          where.lastSeenAt = null;
          break;
        case 'inactive':
          where.lastSeenAt = { lt: daysAgo(21) };
          break;
        case 'at-risk':
          where.lastSeenAt = { gte: daysAgo(21), lt: daysAgo(14) };
          break;
        case 'fading':
          where.lastSeenAt = { gte: daysAgo(14), lt: daysAgo(7) };
          break;
        case 'new':
          where.lastSeenAt = { gte: daysAgo(7) };
          where.visitCount = { lte: 2 };
          break;
        case 'loyal':
          where.lastSeenAt = { gte: daysAgo(7) };
          where.visitCount = { gte: 4 };
          break;
        case 'active':
          where.lastSeenAt = { gte: daysAgo(7) };
          where.visitCount = { gte: 3, lte: 3 };
          break;
      }
    }

    if (params?.lastSeenBefore && where.lastSeenAt !== null) {
      where.lastSeenAt = { ...(typeof where.lastSeenAt === 'object' && where.lastSeenAt ? where.lastSeenAt : {}), lt: new Date(params.lastSeenBefore) };
    }

    if (params?.lastSeenAfter && where.lastSeenAt !== null) {
      where.lastSeenAt = { ...(typeof where.lastSeenAt === 'object' && where.lastSeenAt ? where.lastSeenAt : {}), gte: new Date(params.lastSeenAfter) };
    }

    if (params?.addedAfter || params?.addedBefore) {
      where.createdAt = {
        ...(params.addedAfter && { gte: new Date(params.addedAfter) }),
        ...(params.addedBefore && { lte: new Date(params.addedBefore) }),
      };
    }

    if (minVisits !== undefined || maxVisits !== undefined) {
      where.visitCount = {
        ...(minVisits !== undefined ? { gte: minVisits } : {}),
        ...(maxVisits !== undefined ? { lte: maxVisits } : {}),
        ...(where.visitCount ?? {}),
      };
    }

    if (minTotalSpend !== undefined || maxTotalSpend !== undefined) {
      where.totalSpend = {
        ...(minTotalSpend !== undefined ? { gte: minTotalSpend } : {}),
        ...(maxTotalSpend !== undefined ? { lte: maxTotalSpend } : {}),
      };
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const scalarSortableFields = ['name', 'email', 'phone', 'birthday', 'createdAt', 'visitCount', 'totalSpend', 'lastSeenAt'];
    const orderBy: Prisma.CustomerOrderByWithRelationInput =
      params?.sortBy && scalarSortableFields.includes(params.sortBy)
        ? { [params.sortBy]: params.sortDir ?? 'desc' }
        : { createdAt: 'desc' };

    const computeCustomerMetrics = (customer: any) => {
      const loyaltyPoints = (customer.loyaltyTransactions || []).reduce(
        (sum: number, tx: any) => sum + (tx.type === LoyaltyTxType.EARN ? tx.points : -Math.abs(tx.points)),
        0,
      );

      const totalDiscount = (customer.orders || []).reduce((sum: number, order: any) => {
        const subtotal = (order.items || []).reduce(
          (orderSum: number, item: any) => orderSum + Number(item.unitPrice) * item.quantity,
          0,
        );
        return sum + Math.max(subtotal - Number(order.total), 0);
      }, 0);

      return {
        ...customer,
        loyaltyPoints: Math.max(loyaltyPoints, 0),
        totalDiscount: Number(totalDiscount.toFixed(2)),
      };
    };

    const shouldApplyDerivedFiltersOrSort =
      minLoyaltyPoints !== undefined ||
      maxLoyaltyPoints !== undefined ||
      minTotalDiscount !== undefined ||
      maxTotalDiscount !== undefined ||
      params?.sortBy === 'loyaltyPoints' ||
      params?.sortBy === 'totalDiscount' ||
      params?.sortBy === 'status';

    const sortBy = params?.sortBy;

    const sortCustomers = (items: any[]) => {
      if (!sortBy) return items;
      const direction = params?.sortDir === 'asc' ? 1 : -1;

      return [...items].sort((a, b) => {
        if (sortBy === 'status') {
          const order = ['new', 'loyal', 'active', 'fading', 'at-risk', 'inactive', 'never'];
          return direction * (order.indexOf(this.getCustomerStatus(a)) - order.indexOf(this.getCustomerStatus(b)));
        }

        const aValue = a[sortBy];
        const bValue = b[sortBy];

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue instanceof Date || bValue instanceof Date) {
          return direction * (new Date(aValue).getTime() - new Date(bValue).getTime());
        }

        return direction * (aValue > bValue ? 1 : -1);
      });
    };

    const enrichResults = (customers: any[]) =>
      customers.map((customer) => computeCustomerMetrics(customer));

    if (shouldApplyDerivedFiltersOrSort) {
      const allCustomers = await this.prisma.customer.findMany({
        where,
        include: {
          loyaltyTransactions: true,
          orders: {
            include: {
              items: {
                select: { quantity: true, unitPrice: true },
              },
            },
          },
        },
      });

      let results = enrichResults(allCustomers);

      if (minLoyaltyPoints !== undefined || maxLoyaltyPoints !== undefined) {
        results = results.filter((customer) => {
          const value = customer.loyaltyPoints ?? 0;
          if (minLoyaltyPoints !== undefined && value < minLoyaltyPoints) return false;
          if (maxLoyaltyPoints !== undefined && value > maxLoyaltyPoints) return false;
          return true;
        });
      }

      if (minTotalDiscount !== undefined || maxTotalDiscount !== undefined) {
        results = results.filter((customer) => {
          const value = customer.totalDiscount ?? 0;
          if (minTotalDiscount !== undefined && value < minTotalDiscount) return false;
          if (maxTotalDiscount !== undefined && value > maxTotalDiscount) return false;
          return true;
        });
      }

      results = sortCustomers(results);
      const total = results.length;
      const data = params?.page === undefined ? results : results.slice(skip, skip + take);

      if (params?.page === undefined) {
        return data;
      }

      return {
        data,
        pagination: {
          page: params.page,
          limit: take,
          total,
          totalPages: Math.max(1, Math.ceil(total / take)),
        },
      };
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        loyaltyTransactions: true,
        orders: {
          include: {
            items: {
              select: { quantity: true, unitPrice: true },
            },
          },
        },
      },
    });

    const enrichedCustomers = enrichResults(customers);

    if (params?.page === undefined) {
      return enrichedCustomers;
    }

    const total = await this.prisma.customer.count({ where });
    return {
      data: enrichedCustomers,
      pagination: {
        page: params.page,
        limit: take,
        total,
        totalPages: Math.max(1, Math.ceil(total / take)),
      },
    };
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { items: { select: { quantity: true, unitPrice: true } } },
        },
        loyaltyTransactions: { take: 10, orderBy: { createdAt: 'desc' } },
        feedbackTickets: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) {
      return null;
    }

    const balance = customer.loyaltyTransactions.reduce(
      (sum, tx) => sum + (tx.type === LoyaltyTxType.EARN ? tx.points : -Math.abs(tx.points)),
      0,
    );

    const totalDiscount = customer.orders.reduce((sum, order) => {
      const subtotal = order.items.reduce(
        (orderSum, item) => orderSum + Number(item.unitPrice) * item.quantity,
        0,
      );
      return sum + Math.max(subtotal - Number(order.total), 0);
    }, 0);

    const latestAcquisition = await this.prisma.acquisitionLog.findFirst({
      where: { customerId: id },
      include: { executive: { select: { name: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      ...customer,
      loyaltyPoints: Math.max(balance, 0),
      totalDiscount: Number(totalDiscount.toFixed(2)),
      acquisitionSource: latestAcquisition?.source ?? null,
      acquisitionExecutive: latestAcquisition?.executive?.name ?? null,
    };
  }

  private getCustomerStatus(customer: { lastSeenAt?: Date | null; visitCount: number }) {
    if (!customer.lastSeenAt) return 'never';
    const daysSince = Math.floor((Date.now() - new Date(customer.lastSeenAt).getTime()) / 86400000);
    if (daysSince <= 7 && customer.visitCount <= 2) return 'new';
    if (daysSince <= 7 && customer.visitCount >= 4) return 'loyal';
    if (daysSince <= 7) return 'active';
    if (daysSince <= 14) return 'fading';
    if (daysSince <= 21) return 'at-risk';
    return 'inactive';
  }

  private getCustomerStatusTag(customer: { lastSeenAt?: Date | null; visitCount: number; firstSeenAt: Date }) {
    if (!customer.lastSeenAt) return 'new';
    const daysSince = Math.floor((Date.now() - new Date(customer.lastSeenAt).getTime()) / 86400000);
    if (daysSince <= 14) return 'active';
    if (daysSince <= 60) return 'inactive';
    return 'churned';
  }

  async getInsights(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        birthday: true,
        visitCount: true,
        lastSeenAt: true,
      },
    });

    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const latestAcquisition = await this.prisma.acquisitionLog.findFirst({
      where: { customerId },
      include: { executive: { select: { name: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const orders = await this.prisma.order.findMany({
      where: {
        customerId,
        status: { not: OrderStatus.CANCELLED },
      },
      include: {
        items: {
          include: {
            menuItem: { include: { category: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalOrders = orders.length;
    const totalSpend = Number(orders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(2));
    const averageOrderValue = totalOrders > 0 ? Number((totalSpend / totalOrders).toFixed(2)) : 0;
    const lastOrderAt = totalOrders > 0 ? orders[totalOrders - 1].createdAt.toISOString() : null;
    const daysSinceLastOrder = lastOrderAt
      ? Math.floor((Date.now() - new Date(lastOrderAt).getTime()) / 86400000)
      : null;
    const insightsVisitCount = totalOrders;
    const status = this.getCustomerStatus({
      visitCount: insightsVisitCount,
      lastSeenAt: lastOrderAt ? new Date(lastOrderAt) : customer.lastSeenAt,
    });

    const daysAgo = (days: number) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      return cutoff;
    };

    const ordersLast7Days = orders.filter((order) => order.createdAt >= daysAgo(7)).length;
    const ordersLast14Days = orders.filter((order) => order.createdAt >= daysAgo(14)).length;
    const ordersLast21Days = orders.filter((order) => order.createdAt >= daysAgo(21)).length;

    const orderIntervals = orders
      .map((order) => order.createdAt.getTime())
      .sort((a, b) => a - b)
      .map((time, idx, arr) => (idx === 0 ? null : (time - arr[idx - 1]) / 86400000))
      .filter((value): value is number => value !== null);
    const averageDaysBetweenOrders = orderIntervals.length > 0
      ? Number((orderIntervals.reduce((sum, value) => sum + value, 0) / orderIntervals.length).toFixed(1))
      : null;

    const categoryCounts = new Map<string, { name: string; quantity: number; spend: number }>();
    const itemCounts = new Map<string, { name: string; quantity: number; spend: number }>();
    const channelCounts = new Map<string, number>();

    for (const order of orders) {
      channelCounts.set(order.channel, (channelCounts.get(order.channel) || 0) + 1);
      for (const item of order.items) {
        const itemName = item.menuItem?.name || 'Unknown item';
        const quantity = item.quantity || 0;
        const spend = Number(item.unitPrice) * quantity;

        itemCounts.set(itemName, {
          name: itemName,
          quantity: (itemCounts.get(itemName)?.quantity || 0) + quantity,
          spend: (itemCounts.get(itemName)?.spend || 0) + spend,
        });

        const categoryName = item.menuItem?.category?.name || 'Uncategorized';
        categoryCounts.set(categoryName, {
          name: categoryName,
          quantity: (categoryCounts.get(categoryName)?.quantity || 0) + quantity,
          spend: (categoryCounts.get(categoryName)?.spend || 0) + spend,
        });
      }
    }

    const topItems = Array.from(itemCounts.values())
      .sort((a, b) => b.quantity - a.quantity || b.spend - a.spend)
      .slice(0, 3);

    const favoriteCategory = Array.from(categoryCounts.values())
      .sort((a, b) => b.quantity - a.quantity || b.spend - a.spend)[0]?.name;

    const channelBreakdown = Array.from(channelCounts.entries())
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count)
      .map((entry) => ({
        channel: entry.channel,
        count: entry.count,
        sharePercent: totalOrders > 0 ? Number(((entry.count / totalOrders) * 100).toFixed(0)) : 0,
      }));

    const orderHourCounts = new Array(24).fill(0);
    orders.forEach((order) => {
      orderHourCounts[order.createdAt.getHours()] += 1;
    });

    const bestHour = orderHourCounts.reduce(
      (best, count, hour) => (count > best.count ? { hour, count } : best),
      { hour: 12, count: 0 },
    );

    const formatHourLabel = (hour: number) => {
      const suffix = hour < 12 ? 'am' : 'pm';
      const displayHour = hour % 12 || 12;
      return `${displayHour}${suffix}`;
    };

    const bestTimeToReengage = bestHour.count > 0
      ? `${formatHourLabel(bestHour.hour)} – ${formatHourLabel((bestHour.hour + 1) % 24)}`
      : 'Any time';

    const heatmapStart = new Date();
    heatmapStart.setDate(heatmapStart.getDate() - 13);
    heatmapStart.setHours(0, 0, 0, 0);
    const heatmapMap = new Map<string, number>();
    orders.forEach((order) => {
      const key = order.createdAt.toISOString().slice(0, 10);
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    });

    const orderFrequencyHeatmap = Array.from({ length: 14 }, (_, index) => {
      const day = new Date(heatmapStart);
      day.setDate(heatmapStart.getDate() + index);
      const dateKey = day.toISOString().slice(0, 10);
      return { date: dateKey, orders: heatmapMap.get(dateKey) ?? 0 };
    });

    const churnScore = totalOrders === 0
      ? 5
      : Math.min(5, Math.max(1, Math.ceil((daysSinceLastOrder ?? 1) / 14)));

    const preferredContact = customer.phone ? 'sms' : customer.email ? 'email' : 'none';
    const recommendedMessage = totalOrders === 0
      ? 'Send a welcome offer to encourage the first order.'
      : status === 'at-risk'
        ? 'This customer is at risk of churning. Send a strong return offer with a preferred item or category.'
        : status === 'fading'
          ? 'They have slowed down. Offer a special deal to bring them back.'
          : status === 'inactive'
            ? 'Re-engage them with a win-back promotion and a clear value message.'
            : status === 'new'
              ? 'Welcome them with a friendly message and a first-order reward.'
              : status === 'loyal'
                ? 'Thank them for loyalty and offer a VIP reward to keep them engaged.'
                : 'Keep them engaged with a personalised offer based on their favourite category.';

    return {
      customerId: customer.id,
      customerName: customer.name,
      lastOrderAt,
      daysSinceLastOrder,
      totalOrders,
      ordersLast7Days,
      ordersLast14Days,
      ordersLast21Days,
      averageOrderValue,
      totalSpend,
      averageDaysBetweenOrders,
      favoriteCategory,
      topItems,
      channelBreakdown,
      customerStatus: status,
      acquisitionSource: latestAcquisition?.source ?? null,
      acquisitionExecutive: latestAcquisition?.executive?.name ?? null,
      bestTimeToReengage,
      churnScore,
      orderFrequencyHeatmap,
      preferredContact,
      recommendedMessage,
      birthday: customer.birthday ? customer.birthday.toISOString().split('T')[0] : null,
    };
  }

  async getChurnRisk() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.prisma.customer.findMany({
      where: {
        visitCount: { gte: 1 },
        lastSeenAt: { lt: sevenDaysAgo },
      },
      orderBy: { lastSeenAt: 'asc' },
    });
  }

  async getUpcomingBirthdays(days = 7) {
    const now = new Date();
    const results: any[] = [];
    for (let i = 0; i <= days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const customers: any[] = await this.prisma.$queryRaw`
        SELECT id, name, phone, email, birthday
        FROM customers
        WHERE birthday IS NOT NULL
          AND EXTRACT(MONTH FROM birthday) = ${month}
          AND EXTRACT(DAY FROM birthday) = ${day}
        LIMIT 50
      `;
      for (const c of customers) {
        results.push({ ...c, daysUntil: i });
      }
    }
    return results;
  }

  async getDashboard() {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [total, newThisWeek, activeThisWeek, churnRisk, orderTotals, recentCustomers] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { firstSeenAt: { gte: sevenDaysAgo } } }),
      this.prisma.customer.count({ where: { lastSeenAt: { gte: sevenDaysAgo } } }),
      this.prisma.customer.count({
        where: { visitCount: { gte: 1 }, lastSeenAt: { lt: sevenDaysAgo } },
      }),
      this.prisma.order.aggregate({
        where: { customerId: { not: null }, status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
        _count: { _all: true },
      }),
      this.prisma.customer.findMany({
        where: { firstSeenAt: { gte: thirtyDaysAgo } },
        select: { firstSeenAt: true },
      }),
    ]);

    const totalSpend = Number(orderTotals._sum?.total || 0);
    const totalVisits = orderTotals._count._all;
    const acquisitionTrend: Array<{ date: string; customers: number }> = [];
    const trendMap = new Map<string, number>();
    recentCustomers.forEach((customer) => {
      const key = customer.firstSeenAt.toISOString().slice(0, 10);
      trendMap.set(key, (trendMap.get(key) || 0) + 1);
    });
    for (let i = 0; i < 30; i += 1) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(thirtyDaysAgo.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      acquisitionTrend.push({ date: key, customers: trendMap.get(key) ?? 0 });
    }

    const averageNewPerDay = recentCustomers.length / 30;
    const goalTarget = 1000;
    const progressPercent = total > 0 ? Math.min(Math.round((total / goalTarget) * 100), 100) : 0;
    const projectedTargetDate = averageNewPerDay > 0 && total < goalTarget
      ? new Date(now.getTime() + Math.ceil((goalTarget - total) / averageNewPerDay) * 86400000).toISOString().slice(0, 10)
      : null;

    return {
      total,
      newThisWeek,
      activeThisWeek,
      activeThisMonth: activeThisWeek,
      churnRisk,
      totalSpend,
      averageSpend: total > 0 ? Math.round((totalSpend / total) * 100) / 100 : 0,
      totalVisits,
      averageVisits: total > 0 ? Math.round(totalVisits / total) : 0,
      retentionRate: total > 0 ? Math.round((activeThisWeek / total) * 100) : 0,
      customerGoal: goalTarget,
      progressPercent,
      projectedTargetDate,
      acquisitionTrend,
    };
  }

  async sendSms(dto: SendSmsDto) {
    const { customerIds, message } = dto;
    if (!message.trim()) throw new BadRequestException('Message cannot be empty');
    if (!customerIds.length) throw new BadRequestException('No customers selected');

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, phone: true },
    });

    const withPhone = customers.filter((c) => c.phone);
    const noPhone = customers.filter((c) => !c.phone).map((c) => c.name);

    if (withPhone.length === 0) {
      return { sent: 0, failed: 0, noPhone };
    }

    const normalizePhone = (phone: string) => {
      const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '');
      if (cleaned.startsWith('0')) return '233' + cleaned.slice(1);
      if (cleaned.startsWith('233')) return cleaned;
      return cleaned;
    };

    const apiKey = this.config.get<string>('ARKESEL_API_KEY');
    const senderId = this.config.get<string>('ARKESEL_SENDER_ID') ?? 'Crave&Co';
    if (!apiKey || apiKey === 'your_arkesel_api_key_here') {
      throw new InternalServerErrorException('SMS service is not configured. Set ARKESEL_API_KEY in the server environment.');
    }

    const callArkesel = async (to: string, text: string): Promise<void> => {
      const url = new URL('https://sms.arkesel.com/sms/api');
      url.searchParams.set('action', 'send-sms');
      url.searchParams.set('api_key', apiKey!);
      url.searchParams.set('to', to);
      url.searchParams.set('from', senderId);
      url.searchParams.set('sms', text.trim());

      let raw: string;
      try {
        const res = await fetch(url.toString());
        raw = await res.text();
      } catch {
        throw new BadRequestException('Could not reach SMS gateway. Check server network connectivity.');
      }

      let data: { code: string; message?: string };
      try {
        data = JSON.parse(raw) as { code: string; message?: string };
      } catch {
        throw new BadRequestException(`Unexpected SMS gateway response: ${raw.slice(0, 120)}`);
      }

      if (data.code !== 'ok') {
        throw new BadRequestException(data.message ?? `SMS gateway error (code: ${data.code})`);
      }
    };

    if (message.includes('{name}')) {
      // Personalised: individual request per customer with {name} substituted
      let sent = 0;
      for (const c of withPhone) {
        await callArkesel(normalizePhone(c.phone!), message.replace(/\{name\}/g, c.name));
        sent++;
      }
      return { sent, failed: 0, noPhone };
    }

    // Bulk: all numbers in one call
    await callArkesel(
      withPhone.map((c) => normalizePhone(c.phone!)).join(','),
      message,
    );

    return { sent: withPhone.length, failed: 0, noPhone };
  }
}
