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
    lastSeenBefore?: string;
    addedAfter?: string;
    addedBefore?: string;
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

    if (params?.lastSeenBefore) {
      where.lastSeenAt = { lt: new Date(params.lastSeenBefore) };
    }

    if (params?.addedAfter || params?.addedBefore) {
      where.createdAt = {
        ...(params.addedAfter && { gte: new Date(params.addedAfter) }),
        ...(params.addedBefore && { lte: new Date(params.addedBefore) }),
      };
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (customers.length === 0) {
      return customers;
    }

    const customerIds = customers.map((customer) => customer.id);

    const customerStats = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        customerId: { in: customerIds },
        status: { not: OrderStatus.CANCELLED },
      },
      _sum: { total: true },
      _count: { _all: true },
    });

    const customerOrders = await this.prisma.order.findMany({
      where: {
        customerId: { in: customerIds },
        status: { not: OrderStatus.CANCELLED },
      },
      select: {
        customerId: true,
        total: true,
        items: { select: { quantity: true, unitPrice: true } },
      },
    }) as Array<{
      customerId: string | null;
      total: Prisma.Decimal;
      items: { quantity: number; unitPrice: Prisma.Decimal }[];
    }>;

    const loyaltyTransactions = await this.prisma.loyaltyTransaction.findMany({
      where: { customerId: { in: customerIds } },
      select: { customerId: true, type: true, points: true },
    });

    const statsMap = new Map(
      customerStats.map((stat) => [
        stat.customerId!,
        {
          totalSpend: Number(stat._sum.total || 0),
          visitCount: stat._count._all,
        },
      ]),
    );

    const discountMap = new Map<string, number>();
    customerOrders.forEach((order) => {
      const subtotal = order.items.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      );
      const discount = Math.max(subtotal - Number(order.total), 0);
      discountMap.set(order.customerId!, (discountMap.get(order.customerId!) || 0) + discount);
    });

    const loyaltyPointsMap = new Map<string, number>();
    loyaltyTransactions.forEach((transaction) => {
      const current = loyaltyPointsMap.get(transaction.customerId) ?? 0;
      loyaltyPointsMap.set(
        transaction.customerId!,
        current + (transaction.type === LoyaltyTxType.EARN ? transaction.points : -Math.abs(transaction.points)),
      );
    });

    const customersWithStats = customers.map((customer) => ({
      ...customer,
      totalSpend: statsMap.get(customer.id)?.totalSpend ?? Number(customer.totalSpend),
      visitCount: statsMap.get(customer.id)?.visitCount ?? customer.visitCount,
      loyaltyPoints: Math.max(loyaltyPointsMap.get(customer.id) ?? 0, 0),
      totalDiscount: Number((discountMap.get(customer.id) || 0).toFixed(2)),
    }));

    const getStatusRank = (customer: any) => {
      if (!customer.lastSeenAt) return 6;
      const daysSince = Math.floor((Date.now() - new Date(customer.lastSeenAt).getTime()) / 86400000);
      if (daysSince <= 7 && customer.visitCount >= 4) return 0;
      if (daysSince <= 7 && customer.visitCount === 3) return 1;
      if (daysSince <= 7 && customer.visitCount <= 2) return 2;
      if (daysSince <= 14) return 3;
      if (daysSince <= 21) return 4;
      return 5;
    };

    const sortBy = params?.sortBy;
    const dir = params?.sortDir === 'asc' ? 1 : -1;

    const sortedCustomers = sortBy
      ? [...customersWithStats].sort((a, b) => {
          const getValue = (customer: any) => {
            switch (sortBy) {
              case 'name': return customer.name ?? '';
              case 'email': return customer.email ?? '';
              case 'phone': return customer.phone ?? '';
              case 'birthday': return customer.birthday ? new Date(customer.birthday).getTime() : 0;
              case 'visitCount': return customer.visitCount;
              case 'loyaltyPoints': return customer.loyaltyPoints ?? 0;
              case 'totalDiscount': return customer.totalDiscount ?? 0;
              case 'totalSpend': return customer.totalSpend ?? 0;
              case 'lastSeenAt': return customer.lastSeenAt ? new Date(customer.lastSeenAt).getTime() : 0;
              case 'status': return getStatusRank(customer);
              case 'createdAt': return new Date(customer.createdAt).getTime();
              default: return customer.createdAt ? new Date(customer.createdAt).getTime() : 0;
            }
          };

          const av = getValue(a);
          const bv = getValue(b);
          if (av === bv) return 0;
          if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
          return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true }) * dir;
        })
      : customersWithStats;

    return sortedCustomers.slice(skip, skip + take);
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

    return {
      ...customer,
      loyaltyPoints: Math.max(balance, 0),
      totalDiscount: Number(totalDiscount.toFixed(2)),
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

    const [total, newThisWeek, activeThisWeek, churnRisk, orderTotals] = await Promise.all([
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
    ]);

    const totalSpend = Number(orderTotals._sum?.total || 0);
    const totalVisits = orderTotals._count._all;
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
