import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { CreateIngredientDto, CreateMovementDto, CreateStockCountDto, UpdateIngredientDto } from './dto/inventory.dto';
export declare class InventoryService {
    private prisma;
    private alerts;
    constructor(prisma: PrismaService, alerts: AlertsService);
    private normalizeMovementQuantity;
    getIngredients(page?: number, limit?: number): Promise<{
        name: string;
        id: string;
        unit: string;
        currentCost: Prisma.Decimal;
        reorderLevel: Prisma.Decimal;
    }[]>;
    createIngredient(dto: CreateIngredientDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        unit: string;
        currentCost: Prisma.Decimal;
        reorderLevel: Prisma.Decimal;
        supplierId: string | null;
    }>;
    updateIngredient(id: string, dto: UpdateIngredientDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        unit: string;
        currentCost: Prisma.Decimal;
        reorderLevel: Prisma.Decimal;
        supplierId: string | null;
    }>;
    getStock(branchId: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            name: string;
            unit: string;
            currentCost: number;
            reorderLevel: Prisma.Decimal;
            onHand: number;
            belowReorder: boolean;
            supplier: {
                email: string | null;
                name: string;
                phone: string | null;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                paymentTerms: string | null;
            } | null;
        }[];
        totalCount: number;
        lowStockCount: number;
        pageLowStockCount: number;
    }>;
    private getCurrentOnHand;
    createMovement(dto: CreateMovementDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: Prisma.Decimal;
        ingredientId: string;
        type: import("@prisma/client").$Enums.MovementType;
        reason: string | null;
        referenceId: string | null;
    }>;
    getMovements(branchId: string, page?: number, limit?: number): Promise<({
        ingredient: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            unit: string;
            currentCost: Prisma.Decimal;
            reorderLevel: Prisma.Decimal;
            supplierId: string | null;
        };
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: Prisma.Decimal;
        ingredientId: string;
        type: import("@prisma/client").$Enums.MovementType;
        reason: string | null;
        referenceId: string | null;
    })[]>;
    getMovementAnalytics(branchId: string): Promise<{
        totalMovements: number;
        typeCounts: Record<string, number>;
        typeQuantities: Record<string, number>;
    }>;
    getLowStock(branchId: string, page?: number, limit?: number): Promise<{
        id: string;
        name: string;
        unit: string;
        currentCost: number;
        reorderLevel: Prisma.Decimal;
        onHand: number;
        belowReorder: boolean;
        supplier: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            paymentTerms: string | null;
        } | null;
    }[]>;
    createStockCount(dto: CreateStockCountDto): Promise<{
        branchId: string;
        id: string;
        ingredientId: string;
        counted: Prisma.Decimal;
        expected: Prisma.Decimal;
        variance: Prisma.Decimal;
        countedAt: Date;
    }>;
}
