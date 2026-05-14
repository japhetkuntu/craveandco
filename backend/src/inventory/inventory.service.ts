import { Injectable } from '@nestjs/common';
import { Prisma, AlertSeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { CreateIngredientDto, CreateMovementDto, CreateStockCountDto, UpdateIngredientDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService, private alerts: AlertsService) {}

  private normalizeMovementQuantity(type: string, quantity: Prisma.Decimal | number | string) {
    const value = Number(quantity);
    if (Number.isNaN(value)) return 0;

    if (type === 'WASTE' || type === 'USAGE') {
      return -Math.abs(value);
    }

    if (type === 'PURCHASE_IN') {
      return Math.abs(value);
    }

    return value;
  }

  async getIngredients(page = 0, limit = 10, search?: string) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    const query = search?.trim();
    return this.prisma.ingredient.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { unit: { contains: query, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: { id: true, name: true, unit: true, currentCost: true, reorderLevel: true },
      orderBy: { name: 'asc' },
      take,
      skip,
    });
  }

  async createIngredient(dto: CreateIngredientDto) {
    return this.prisma.ingredient.create({
      data: {
        name: dto.name.trim(),
        unit: dto.unit.trim(),
        currentCost: dto.currentCost ?? 0,
        reorderLevel: dto.reorderLevel ?? 0,
      },
    });
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.unit !== undefined) data.unit = dto.unit.trim();
    if (dto.currentCost !== undefined) data.currentCost = dto.currentCost;
    if (dto.reorderLevel !== undefined) data.reorderLevel = dto.reorderLevel;
    return this.prisma.ingredient.update({ where: { id }, data });
  }

  async getStock(branchId: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;

    const [totalCount, ingredients, allIngredients, allMovements] = await Promise.all([
      this.prisma.ingredient.count(),
      this.prisma.ingredient.findMany({
        include: { supplier: true },
        take,
        skip,
        orderBy: { name: 'asc' },
      }),
      this.prisma.ingredient.findMany({ select: { id: true, reorderLevel: true } }),
      this.prisma.inventoryMovement.groupBy({
        by: ['ingredientId', 'type'],
        where: { branchId },
        _sum: { quantity: true },
      }),
    ]);

    const movementMap = new Map<string, number>();
    allMovements.forEach((movement) => {
      const signed = this.normalizeMovementQuantity(movement.type, movement._sum?.quantity ?? 0);
      movementMap.set(movement.ingredientId, (movementMap.get(movement.ingredientId) ?? 0) + signed);
    });
    const lowStockCount = allIngredients.reduce((count, ingredient) => {
      const onHand = Number(movementMap.get(ingredient.id) ?? 0);
      return count + (onHand < Number(ingredient.reorderLevel) ? 1 : 0);
    }, 0);

    const items = ingredients.map((ing) => {
      const quantity = movementMap.get(ing.id) ?? 0;
      const onHand = Number(quantity);
      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        currentCost: Number(ing.currentCost),
        reorderLevel: ing.reorderLevel,
        onHand,
        belowReorder: onHand < Number(ing.reorderLevel),
        supplier: ing.supplier,
      };
    });

    const totalAssetValue = items.reduce((sum, item) => sum + item.onHand * item.currentCost, 0);
    const pageLowStockCount = items.filter((item) => item.belowReorder).length;

    return {
      items,
      totalCount,
      lowStockCount,
      pageLowStockCount,
      totalAssetValue,
    };
  }

  private async getCurrentOnHand(branchId: string, ingredientId: string): Promise<number> {
    const movements = await this.prisma.inventoryMovement.groupBy({
      by: ['ingredientId', 'type'],
      where: { branchId, ingredientId },
      _sum: { quantity: true },
    });
    return movements.reduce((total, movement) => total + this.normalizeMovementQuantity(movement.type, movement._sum?.quantity ?? 0), 0);
  }

  async createMovement(dto: CreateMovementDto) {
    const quantity = this.normalizeMovementQuantity(dto.type, dto.quantity);
    const previousOnHand = await this.getCurrentOnHand(dto.branchId, dto.ingredientId);
    const movement = await this.prisma.inventoryMovement.create({ data: { ...dto, quantity } });

    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: dto.ingredientId },
      select: { name: true, unit: true, reorderLevel: true },
    });

    if (ingredient) {
      const afterOnHand = previousOnHand + quantity;
      const reorderLevel = Number(ingredient.reorderLevel);
      if (previousOnHand >= reorderLevel && afterOnHand < reorderLevel) {
        await this.alerts.createAlert(
          dto.branchId,
          'LOW_STOCK',
          AlertSeverity.WARNING,
          `Low stock alert: ${ingredient.name} has fallen below reorder level (${afterOnHand.toFixed(2)} ${ingredient.unit}).`,
        );
      }
    }

    return movement;
  }

  async getMovements(branchId: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;
    return this.prisma.inventoryMovement.findMany({
      where: { branchId },
      include: { ingredient: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
  }

  async getMovementAnalytics(branchId: string) {
    const movements = await this.prisma.inventoryMovement.findMany({
      where: { branchId },
      select: { type: true, quantity: true },
    });

    const summary = {
      totalMovements: movements.length,
      typeCounts: {
        PURCHASE_IN: 0,
        WASTE: 0,
        USAGE: 0,
        ADJUSTMENT: 0,
        STOCK_COUNT: 0,
      },
      typeQuantities: {
        PURCHASE_IN: 0,
        WASTE: 0,
        USAGE: 0,
        ADJUSTMENT: 0,
        STOCK_COUNT: 0,
      },
    } as {
      totalMovements: number;
      typeCounts: Record<string, number>;
      typeQuantities: Record<string, number>;
    };

    movements.forEach((movement) => {
      const typeKey = movement.type as keyof typeof summary.typeCounts;
      summary.typeCounts[typeKey] = (summary.typeCounts[typeKey] || 0) + 1;
      summary.typeQuantities[typeKey] = (summary.typeQuantities[typeKey] || 0) + Math.abs(Number(movement.quantity));
    });

    return summary;
  }

  async getLowStock(branchId: string, page = 0, limit = 10) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;

    const [ingredients, movements] = await Promise.all([
      this.prisma.ingredient.findMany({ include: { supplier: true }, orderBy: { name: 'asc' } }),
      this.prisma.inventoryMovement.groupBy({
        by: ['ingredientId', 'type'],
        where: { branchId },
        _sum: { quantity: true },
      }),
    ]);

    const movementMap = new Map<string, number>();
    movements.forEach((movement) => {
      const signed = this.normalizeMovementQuantity(movement.type, movement._sum?.quantity ?? 0);
      movementMap.set(movement.ingredientId, (movementMap.get(movement.ingredientId) ?? 0) + signed);
    });
    const lowStockItems = ingredients
      .map((ing) => {
        const onHand = Number(movementMap.get(ing.id) ?? 0);
        return {
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          currentCost: Number(ing.currentCost),
          reorderLevel: ing.reorderLevel,
          onHand,
          belowReorder: onHand < Number(ing.reorderLevel),
          supplier: ing.supplier,
        };
      })
      .filter((item) => item.belowReorder);

    return lowStockItems.slice(skip, skip + take);
  }

  async createStockCount(dto: CreateStockCountDto) {
    return this.prisma.stockCount.create({
      data: {
        ...dto,
        variance: dto.counted - dto.expected,
      },
    });
  }
}
