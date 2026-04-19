import { RecipesService } from './recipes.service';
import { CreateRecipeItemDto, UpdateRecipeItemDto, ImportRecipeItemsDto } from './dto/recipes.dto';
export declare class RecipesController {
    private recipes;
    constructor(recipes: RecipesService);
    getRecipeItems(itemId: string, page?: string, limit?: string): Promise<({
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
        id: string;
        menuItemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        unit: string;
    })[]>;
    createRecipeItem(itemId: string, dto: CreateRecipeItemDto): Promise<{
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
        id: string;
        menuItemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        unit: string;
    }>;
    getRecipeImportSources(itemId: string): Promise<{
        name: string;
        id: string;
        price: import("@prisma/client/runtime/library").Decimal;
        category: {
            name: string;
            id: string;
        };
    }[]>;
    importRecipeItems(itemId: string, dto: ImportRecipeItemsDto): Promise<({
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
        id: string;
        menuItemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        unit: string;
    })[]>;
    updateRecipeItem(itemId: string, id: string, dto: UpdateRecipeItemDto): Promise<{
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
        id: string;
        menuItemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        unit: string;
    }>;
    deleteRecipeItem(itemId: string, id: string): Promise<{
        id: string;
        menuItemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        unit: string;
    }>;
}
