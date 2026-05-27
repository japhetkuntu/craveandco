import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedeemSpinDto } from './dto/redeem-spin.dto';

interface ListEntriesParams {
  page: number;
  limit: number;
  search?: string;
}

@Injectable()
export class RaffleAdminService {
  constructor(private prisma: PrismaService) {}

  async listEntries({ page, limit, search }: ListEntriesParams) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { phone: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { accessCode: { contains: search.toUpperCase() } },
          ],
        }
      : {};

    const [total, entries] = await this.prisma.$transaction([
      this.prisma.customerRaffleEntry.count({ where }),
      this.prisma.customerRaffleEntry.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
        skip,
        take: limit,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          spins: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              redeemedBy: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    const codes = entries.map((entry) => entry.accessCode);
    const ordersGrouped = codes.length
      ? await this.prisma.order.groupBy({
          by: ['raffleAccessCode'],
          where: { raffleAccessCode: { in: codes } },
          _count: { _all: true },
          _sum: { total: true },
        })
      : [];

    const ordersByCode = new Map<string, { count: number; total: number }>(
      ordersGrouped
        .filter((g): g is typeof g & { raffleAccessCode: string } => !!g.raffleAccessCode)
        .map((g) => [
          g.raffleAccessCode,
          { count: g._count?._all ?? 0, total: Number(g._sum?.total ?? 0) },
        ]),
    );

    const data = entries.map((entry) => {
      const orderInfo = ordersByCode.get(entry.accessCode) ?? { count: 0, total: 0 };
      const latestSpin = entry.spins[0];
      const pendingRewards = entry.spins.filter((s) => !s.redeemedAt).length;
      return {
        id: entry.id,
        phone: entry.phone,
        name: entry.name,
        accessCode: entry.accessCode,
        spinCount: entry.spinCount,
        dailySpinCount: entry.dailySpinCount,
        lastSpinAt: entry.lastSpinAt?.toISOString() ?? null,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        pendingRewards,
        latestReward: latestSpin
          ? {
              id: latestSpin.id,
              type: latestSpin.rewardType,
              label: latestSpin.rewardLabel,
              wonAt: latestSpin.createdAt.toISOString(),
              redeemedAt: latestSpin.redeemedAt?.toISOString() ?? null,
              redeemedBy: latestSpin.redeemedBy
                ? { id: latestSpin.redeemedBy.id, name: latestSpin.redeemedBy.name }
                : null,
              redeemedOrderId: latestSpin.redeemedOrderId,
              redemptionNote: latestSpin.redemptionNote,
            }
          : null,
        recentSpins: entry.spins.map((spin) => ({
          id: spin.id,
          rewardType: spin.rewardType,
          rewardLabel: spin.rewardLabel,
          wonAt: spin.createdAt.toISOString(),
          redeemedAt: spin.redeemedAt?.toISOString() ?? null,
          redeemedBy: spin.redeemedBy
            ? { id: spin.redeemedBy.id, name: spin.redeemedBy.name }
            : null,
          redeemedOrderId: spin.redeemedOrderId,
          redemptionNote: spin.redemptionNote,
        })),
        customer: entry.customer
          ? { id: entry.customer.id, name: entry.customer.name, phone: entry.customer.phone }
          : null,
        ordersUsingCode: orderInfo.count,
        ordersTotal: orderInfo.total,
        converted: orderInfo.count > 0,
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalEntries,
      totalSpins,
      spinsToday,
      entriesToday,
      ordersWithCode,
      rewardsRedeemed,
      pendingRewards,
      redeemedToday,
      rewardBreakdown,
    ] = await this.prisma.$transaction([
      this.prisma.customerRaffleEntry.count(),
      this.prisma.customerRaffleSpin.count(),
      this.prisma.customerRaffleSpin.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.customerRaffleEntry.count({ where: { createdAt: { gte: startOfDay } } }),
      this.prisma.order.count({ where: { raffleAccessCode: { not: null } } }),
      this.prisma.customerRaffleSpin.count({ where: { redeemedAt: { not: null } } }),
      this.prisma.customerRaffleSpin.count({ where: { redeemedAt: null } }),
      this.prisma.customerRaffleSpin.count({ where: { redeemedAt: { gte: startOfDay } } }),
      this.prisma.customerRaffleSpin.groupBy({
        by: ['rewardType'],
        _count: { _all: true },
        orderBy: { rewardType: 'asc' },
      }),
    ]);

    const conversionRate = totalEntries > 0 ? (ordersWithCode / totalEntries) * 100 : 0;
    const redemptionRate = totalSpins > 0 ? (rewardsRedeemed / totalSpins) * 100 : 0;

    return {
      totalEntries,
      totalSpins,
      spinsToday,
      entriesToday,
      ordersWithCode,
      rewardsRedeemed,
      pendingRewards,
      redeemedToday,
      conversionRate: Math.round(conversionRate * 10) / 10,
      redemptionRate: Math.round(redemptionRate * 10) / 10,
      rewardBreakdown: rewardBreakdown.map((row) => ({
        rewardType: row.rewardType,
        count: (row._count as { _all?: number } | undefined)?._all ?? 0,
      })),
    };
  }

  async redeemSpin(spinId: string, userId: string, dto: RedeemSpinDto) {
    const spin = await this.prisma.customerRaffleSpin.findUnique({
      where: { id: spinId },
      include: { raffleEntry: true },
    });
    if (!spin) throw new NotFoundException('Raffle spin not found.');
    if (spin.redeemedAt) {
      throw new BadRequestException('This reward has already been redeemed.');
    }

    let orderId: string | undefined;
    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { id: true, raffleAccessCode: true },
      });
      if (!order) throw new BadRequestException('Linked order not found.');
      if (
        order.raffleAccessCode &&
        order.raffleAccessCode.toUpperCase() !== spin.raffleEntry.accessCode.toUpperCase()
      ) {
        throw new BadRequestException(
          'Order is linked to a different raffle access code.',
        );
      }
      orderId = order.id;
    }

    return this.prisma.customerRaffleSpin.update({
      where: { id: spinId },
      data: {
        redeemedAt: new Date(),
        redeemedById: userId,
        redeemedOrderId: orderId,
        redemptionNote: dto.note?.trim() || null,
      },
      include: { redeemedBy: { select: { id: true, name: true } } },
    });
  }

  async unredeemSpin(spinId: string) {
    const spin = await this.prisma.customerRaffleSpin.findUnique({ where: { id: spinId } });
    if (!spin) throw new NotFoundException('Raffle spin not found.');
    if (!spin.redeemedAt) {
      throw new BadRequestException('This reward is not marked as redeemed.');
    }
    return this.prisma.customerRaffleSpin.update({
      where: { id: spinId },
      data: {
        redeemedAt: null,
        redeemedById: null,
        redeemedOrderId: null,
        redemptionNote: null,
      },
    });
  }

  /**
   * Resolve a raffle access code to its entry, latest unredeemed spin,
   * and the active promotion linked to that reward type.
   * Used by the POS to preview + auto-apply a raffle reward at payment time.
   */
  async resolveByCode(code: string, branchId: string) {
    const entry = await this.prisma.customerRaffleEntry.findUnique({
      where: { accessCode: code.trim().toUpperCase() },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        spins: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!entry) throw new NotFoundException('No raffle entry found for this access code.');

    const latestPendingSpin = entry.spins.find((s) => !s.redeemedAt) ?? null;
    if (!latestPendingSpin) {
      return {
        entry: {
          id: entry.id,
          phone: entry.phone,
          name: entry.name,
          accessCode: entry.accessCode,
          customer: entry.customer,
        },
        spin: null,
        promotion: null,
      };
    }

    const now = new Date();
    const promotion = await this.prisma.promotion.findFirst({
      where: {
        branchId,
        raffleRewardType: latestPendingSpin.rewardType,
        status: 'ACTIVE',
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
    });

    return {
      entry: {
        id: entry.id,
        phone: entry.phone,
        name: entry.name,
        accessCode: entry.accessCode,
        customer: entry.customer,
      },
      spin: {
        id: latestPendingSpin.id,
        rewardType: latestPendingSpin.rewardType,
        rewardLabel: latestPendingSpin.rewardLabel,
        wonAt: latestPendingSpin.createdAt.toISOString(),
      },
      promotion: promotion
        ? {
            id: promotion.id,
            name: promotion.name,
            type: promotion.type,
            value: Number(promotion.value),
            discountScope: (promotion as any).discountScope ?? 'ALL_ITEMS',
            raffleRewardType: (promotion as any).raffleRewardType,
          }
        : null,
    };
  }
}
