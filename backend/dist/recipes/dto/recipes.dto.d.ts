export declare class CreateRecipeItemDto {
    ingredientId?: string;
    ingredientName?: string;
    quantity: number;
    unitCost?: number;
    unit?: string;
}
export declare class UpdateRecipeItemDto {
    ingredientId?: string;
    ingredientName?: string;
    quantity?: number;
    unitCost?: number;
    unit?: string;
}
export declare class ImportRecipeItemsDto {
    sourceMenuItemId: string;
}
