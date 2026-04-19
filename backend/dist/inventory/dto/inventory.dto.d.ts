import { MovementType } from '@prisma/client';
export declare class CreateMovementDto {
    ingredientId: string;
    branchId: string;
    type: MovementType;
    quantity: number;
    reason?: string;
    referenceId?: string;
}
export declare class CreateStockCountDto {
    ingredientId: string;
    branchId: string;
    counted: number;
    expected: number;
}
export declare class CreateIngredientDto {
    name: string;
    unit: string;
    currentCost?: number;
    reorderLevel?: number;
}
export declare class UpdateIngredientDto {
    name?: string;
    unit?: string;
    currentCost?: number;
    reorderLevel?: number;
}
