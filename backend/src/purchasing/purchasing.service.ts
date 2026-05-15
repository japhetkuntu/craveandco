import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto, CreateSupplierDto } from './dto/purchasing.dto';
import { Role } from '@prisma/client';

@Injectable()
export class PurchasingService {
  constructor(private prisma: PrismaService) {}

  async createSupplier(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  async findSuppliers(page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      take,
      skip,
    });
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, userId: string, userRole: Role) {
    const totalAmount = dto.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        branchId: dto.branchId,
        supplierId: dto.supplierId,
        notes: dto.notes,
        totalAmount,
        items: {
          create: dto.items.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        },
      },
      include: { items: { include: { ingredient: true } }, supplier: true },
    });

    if (userRole === 'OPERATIONS_MANAGER') {
      await this.prisma.expense.create({
        data: {
          branchId: dto.branchId,
          category: 'Purchase Request',
          amount: totalAmount,
          description: dto.notes || `Purchase order request for supplier ${purchaseOrder.supplier.name}`,
          paidBy: userId,
          approved: null,
        },
      });
    }

    return purchaseOrder;
  }

  async receivePurchaseOrder(id: string, dto: ReceivePurchaseOrderDto) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');

    // Update received quantities and create inventory movements
    for (const item of dto.items) {
      const poItem = po.items.find((i) => i.id === item.purchaseOrderItemId);
      if (!poItem) continue;
      await this.prisma.purchaseOrderItem.update({
        where: { id: item.purchaseOrderItemId },
        data: { receivedQty: item.receivedQty },
      });
      await this.prisma.inventoryMovement.create({
        data: {
          ingredientId: poItem.ingredientId,
          branchId: po.branchId,
          type: 'PURCHASE_IN',
          quantity: item.receivedQty,
          referenceId: po.id,
        },
      });
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED', receivedAt: new Date() },
      include: { items: { include: { ingredient: true } }, supplier: true },
    });
  }

  async findPurchaseOrders(branchId: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.purchaseOrder.findMany({
      where: { branchId },
      include: { items: { include: { ingredient: true } }, supplier: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async approvePurchaseOrder(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status === 'RECEIVED') {
      return this.prisma.purchaseOrder.findUnique({
        where: { id },
        include: { items: { include: { ingredient: true } }, supplier: true },
      });
    }
    if (po.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot approve a purchase order with status ${po.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of po.items) {
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: Number(item.quantity) },
        });
        await tx.inventoryMovement.create({
          data: {
            ingredientId: item.ingredientId,
            branchId: po.branchId,
            type: 'PURCHASE_IN',
            quantity: Number(item.quantity),
            referenceId: po.id,
          },
        });
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: { status: 'RECEIVED', receivedAt: new Date() },
        include: { items: { include: { ingredient: true } }, supplier: true },
      });
    });
  }
}
