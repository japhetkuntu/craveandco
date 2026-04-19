import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoyaltyTxDto } from './dto/loyalty.dto';

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(dto: CreateLoyaltyTxDto) {
    return this.prisma.loyaltyTransaction.create({
      data: dto,
    });
  }

  async listTransactions(page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.loyaltyTransaction.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });
  }

  async getSummary(from?: string, to?: string) {
    const where: any = {};
    if (from) where.createdAt = { ...where.createdAt, gte: new Date(from) };
    if (to) where.createdAt = { ...where.createdAt, lte: new Date(to) };

    const [earned, redeemed] = await Promise.all([
      this.prisma.loyaltyTransaction.aggregate({
        where: { ...where, type: 'EARN' },
        _sum: { points: true },
      }),
      this.prisma.loyaltyTransaction.aggregate({
        where: { ...where, type: 'REDEEM' },
        _sum: { points: true },
      }),
    ]);

    return {
      totalEarned: earned._sum?.points || 0,
      totalRedeemed: redeemed._sum?.points || 0,
      netOutstanding: (earned._sum?.points || 0) - Math.abs(redeemed._sum?.points || 0),
    };
  }

  async getCustomerBalance(customerId: string) {
    const [earned, redeemed] = await Promise.all([
      this.prisma.loyaltyTransaction.aggregate({
        where: { customerId, type: 'EARN' },
        _sum: { points: true },
      }),
      this.prisma.loyaltyTransaction.aggregate({
        where: { customerId, type: { in: ['REDEEM', 'EXPIRE'] } },
        _sum: { points: true },
      }),
    ]);
    const balance = (earned._sum?.points || 0) - Math.abs(redeemed._sum?.points || 0);
    return { customerId, balance };
  }
}
