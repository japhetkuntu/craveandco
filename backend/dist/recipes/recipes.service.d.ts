import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeItemDto, UpdateRecipeItemDto } from './dto/recipes.dto';
export declare class RecipesService {
    private prisma;
    private readonly groupedComponentsOptionId;
    constructor(prisma: PrismaService);
    private stripGroupedComponentsOption;
    private clearGroupedComponentsOption;
    private setGroupedComponentsOption;
    private resolveIngredient;
    getRecipeItems(menuItemId: string, page?: number, limit?: number): Promise<({
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
    createRecipeItem(menuItemId: string, dto: CreateRecipeItemDto): Promise<{
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
    updateRecipeItem(menuItemId: string, recipeItemId: string, dto: UpdateRecipeItemDto): Promise<{
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
    deleteRecipeItem(menuItemId: string, recipeItemId: string): Promise<{
        id: string;
        menuItemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        unit: string;
    }>;
    getRecipeImportSources(menuItemId: string): Promise<{
        name: string;
        id: string;
        price: import("@prisma/client/runtime/library").Decimal;
        category: {
            name: string;
            id: string;
        };
    }[]>;
    importRecipeItems(menuItemId: string, sourceMenuItemIds: string[], importMode?: 'SNAPSHOT' | 'GROUPED'): Promise<({
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
}
