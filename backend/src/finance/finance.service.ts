import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseOrderStatus } from '@prisma/client';
import { CreateExpenseDto, ReconcileCashDto } from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createExpense(userId: string, branchId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: { ...dto, branchId, paidBy: userId, approved: null },
    });
  }

  async findExpenses(branchId: string, from?: string, to?: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.expense.findMany({
      where: {
        branchId,
        ...(from && { paidAt: { gte: new Date(from) } }),
        ...(to && { paidAt: { lte: new Date(to) } }),
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { paidAt: 'desc' },
      take,
      skip,
    });
  }

  async approveExpense(id: string, approved: boolean) {
    return this.prisma.expense.update({
      where: { id },
      data: { approved },
    });
  }

  async reconcileCash(dto: ReconcileCashDto, closedBy: string) {
    return this.prisma.cashReconciliation.create({
      data: {
        branchId: dto.branchId,
        date: new Date(dto.date),
        expectedCash: dto.expectedCash,
        actualCash: dto.actualCash,
        variance: dto.actualCash - dto.expectedCash,
        notes: dto.notes,
        closedBy,
      },
    });
  }

  async getDailySummary(branchId: string, date: string) {
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const [sales, expenses, purchaseOrderItems, reconciliation] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          branchId,
          createdAt: { gte: targetDate, lt: nextDate },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: {
          branchId,
          paidAt: { gte: targetDate, lt: nextDate },
          approved: true,
        },
        _sum: { amount: true },
      }),
      this.prisma.purchaseOrderItem.findMany({
        where: {
          purchaseOrder: {
            branchId,
            receivedAt: { gte: targetDate, lt: nextDate },
            status: { in: [PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.PARTIALLY_RECEIVED] },
          },
        },
        select: { receivedQty: true, unitCost: true },
      }),
      this.prisma.cashReconciliation.findFirst({
        where: { branchId, date: targetDate },
      }),
    ]);

    const purchaseOrderExpense = purchaseOrderItems.reduce(
      (sum, item) => sum + Number(item.receivedQty) * Number(item.unitCost),
      0,
    );
    const expenseSum = Number(expenses._sum?.amount || 0) + purchaseOrderExpense;

    return {
      date,
      totalSales: Number(sales._sum?.total || 0),
      orderCount: sales._count,
      totalExpenses: expenseSum,
      netCash: Number(sales._sum?.total || 0) - expenseSum,
      reconciliation,
    };
  }
}
