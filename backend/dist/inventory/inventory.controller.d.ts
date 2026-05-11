import { InventoryService } from './inventory.service';
import { CreateIngredientDto, CreateMovementDto, CreateStockCountDto, UpdateIngredientDto } from './dto/inventory.dto';
export declare class InventoryController {
    private inventory;
    constructor(inventory: InventoryService);
    getIngredients(page?: string, limit?: string): Promise<{
        name: string;
        id: string;
        unit: string;
        currentCost: import("@prisma/client/runtime/library").Decimal;
        reorderLevel: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    createIngredient(dto: CreateIngredientDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        unit: string;
        currentCost: import("@prisma/client/runtime/library").Decimal;
        reorderLevel: import("@prisma/client/runtime/library").Decimal;
        supplierId: string | null;
    }>;
    updateIngredient(id: string, dto: UpdateIngredientDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        unit: string;
        currentCost: import("@prisma/client/runtime/library").Decimal;
        reorderLevel: import("@prisma/client/runtime/library").Decimal;
        supplierId: string | null;
    }>;
    getStock(branchId: string, page?: string, limit?: string): Promise<{
        items: {
            id: string;
            name: string;
            unit: string;
            currentCost: number;
            reorderLevel: import("@prisma/client/runtime/library").Decimal;
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
    createMovement(dto: CreateMovementDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        type: import("@prisma/client").$Enums.MovementType;
        ingredientId: string;
        reason: string | null;
        referenceId: string | null;
    }>;
    getMovements(branchId: string, page?: string, limit?: string): Promise<({
        ingredient: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            unit: string;
            currentCost: import("@prisma/client/runtime/library").Decimal;
            reorderLevel: import("@prisma/client/runtime/library").Decimal;
            supplierId: string | null;
        };
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        type: import("@prisma/client").$Enums.MovementType;
        ingredientId: string;
        reason: string | null;
        referenceId: string | null;
    })[]>;
    getMovementAnalytics(branchId: string): Promise<{
        totalMovements: number;
        typeCounts: Record<string, number>;
        typeQuantities: Record<string, number>;
    }>;
    getLowStock(branchId: string, page?: string, limit?: string): Promise<{
        id: string;
        name: string;
        unit: string;
        currentCost: number;
        reorderLevel: import("@prisma/client/runtime/library").Decimal;
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
        counted: import("@prisma/client/runtime/library").Decimal;
        expected: import("@prisma/client/runtime/library").Decimal;
        variance: import("@prisma/client/runtime/library").Decimal;
        countedAt: Date;
    }>;
}
