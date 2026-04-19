import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PurchaseOrderStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { InventoryService } from '../inventory/inventory.service';
import { CreateStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { CreatePaymentTypeDto, UpdatePaymentTypeDto } from './dto/payment-type.dto';

@Injectable()
export class OwnerService {
  constructor(private prisma: PrismaService, private inventory: InventoryService) {}

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

  async getDashboard(branchId: string, from?: string, to?: string, date?: string) {
    const { start: targetDate, end: nextDate } = this.parseRange(from, to, date);

    const [sales, expenses, purchaseOrderItems, stockResult, openAlerts, pendingApprovals, ordersWithItems] = await Promise.all([
      this.prisma.order.aggregate({
        where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { branchId, paidAt: { gte: targetDate, lt: nextDate }, approved: true },
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
      this.inventory.getStock(branchId),
      this.prisma.alert.count({
        where: { branchId, status: 'OPEN' },
      }),
      this.prisma.expense.count({
        where: { branchId, approved: null },
      }),
      this.prisma.order.findMany({
        where: { branchId, createdAt: { gte: targetDate, lt: nextDate }, status: { not: OrderStatus.CANCELLED } },
        include: { items: { select: { quantity: true, unitPrice: true } } },
      }),
    ]);

    const totalSales = Number(sales._sum?.total || 0);
    const purchaseOrderExpense = purchaseOrderItems.reduce(
      (sum, item) => sum + Number(item.receivedQty) * Number(item.unitCost),
      0,
    );
    const totalExpenses = Number(expenses._sum?.amount || 0) + purchaseOrderExpense;
    const lowStock = stockResult.lowStockCount;

    const totalDiscounts = ordersWithItems.reduce((sum, order) => {
      const subtotal = order.items.reduce((itemSum, item) => itemSum + Number(item.unitPrice) * item.quantity, 0);
      return sum + Math.max(subtotal - Number(order.total), 0);
    }, 0);

    const [customerOrdersToday, customerRevenueToday] = await Promise.all([
      this.prisma.order.count({
        where: {
          branchId,
          createdAt: { gte: targetDate, lt: nextDate },
          status: { not: OrderStatus.CANCELLED },
          customerId: { not: null },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          branchId,
          createdAt: { gte: targetDate, lt: nextDate },
          status: { not: OrderStatus.CANCELLED },
          customerId: { not: null },
        },
        _sum: { total: true },
      }),
    ]);

    const grossEstimate = totalSales - totalExpenses;
    const customerRevenue = Number(customerRevenueToday._sum?.total || 0);
    const ordersWithoutCustomer = sales._count - customerOrdersToday;
    return {
      date,
      salesToday: totalSales,
      ordersToday: sales._count,
      averageTicket: sales._count > 0 ? Math.round((totalSales / sales._count) * 100) / 100 : 0,
      expensesToday: totalExpenses,
      grossEstimate,
      grossMarginPercent: totalSales > 0 ? Math.round((grossEstimate / totalSales) * 100) : 0,
      expenseRatioPercent: totalSales > 0 ? Math.round((totalExpenses / totalSales) * 100) : 0,
      profitPerOrder: sales._count > 0 ? Math.round((grossEstimate / sales._count) * 100) / 100 : 0,
      expensePerOrder: sales._count > 0 ? Math.round((totalExpenses / sales._count) * 100) / 100 : 0,
      customerOrdersToday,
      customerRevenueToday: customerRevenue,
      customerRevenueSharePercent: totalSales > 0 ? Math.round((customerRevenue / totalSales) * 100) : 0,
      customerOrderRatePercent: sales._count > 0 ? Math.round((customerOrdersToday / sales._count) * 100) : 0,
      ordersWithoutCustomer,
      discountsGiven: Number(totalDiscounts.toFixed(2)),
      lowStockAlerts: lowStock,
      openAlerts,
      pendingApprovals,
    };
  }

  async getPendingApprovals(branchId: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.expense.findMany({
      where: { branchId, approved: null },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { paidAt: 'desc' },
      take,
      skip,
    });
  }

  async approveItem(id: string, approved: boolean) {
    return this.prisma.expense.update({
      where: { id },
      data: { approved },
    });
  }

  async listStaff(branchId: string, page = 0, limit = 10, includeInactive = false) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    const where: any = { branchId };
    if (!includeInactive) {
      where.active = true;
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async createStaff(branchId: string, dto: CreateStaffDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('A user with that email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
        branchId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async updateStaff(id: string, branchId: string, dto: UpdateStaffDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.branchId !== branchId) {
      throw new ForbiddenException('Staff member not found in your branch.');
    }
    if (user.role === Role.OWNER) {
      throw new ForbiddenException('Cannot modify another owner.');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        role: dto.role ?? user.role,
        active: dto.active ?? user.active,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async deactivateStaff(id: string, branchId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.branchId !== branchId) {
      throw new ForbiddenException('Staff member not found in your branch.');
    }
    if (user.role === Role.OWNER) {
      throw new ForbiddenException('Cannot deactivate an owner.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async getOpenAlerts(branchId: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.alert.findMany({
      where: { branchId, status: 'OPEN' },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take,
      skip,
    });
  }

  // ── Payment Types ──────────────────────────────────

  async listPaymentTypes(branchId: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.paymentType.findMany({
      where: { branchId },
      orderBy: { createdAt: 'asc' },
      take,
      skip,
    });
  }

  async createPaymentType(branchId: string, dto: CreatePaymentTypeDto) {
    return this.prisma.paymentType.create({
      data: { branchId, name: dto.name, method: dto.method },
    });
  }

  async updatePaymentType(id: string, dto: UpdatePaymentTypeDto) {
    return this.prisma.paymentType.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.method !== undefined && { method: dto.method }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }

  async deletePaymentType(id: string) {
    return this.prisma.paymentType.delete({ where: { id } });
  }
}
