declare class MenuItemOptionValueDto {
    label: string;
    priceAdjustment?: number;
    id?: string;
}
declare class MenuItemOptionDto {
    name: string;
    label?: string;
    required: boolean;
    multiple: boolean;
    values: MenuItemOptionValueDto[];
    id?: string;
}
export declare class CreateMenuItemDto {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    imageKey?: string;
    available?: boolean;
    dayparts?: string[];
    options?: MenuItemOptionDto[];
}
export declare class UpdateMenuItemDto {
    name?: string;
    description?: string;
    price?: number;
    imageKey?: string | null;
    available?: boolean;
    categoryId?: string;
    dayparts?: string[];
    options?: MenuItemOptionDto[];
}
export declare class CreateCategoryDto {
    name: string;
    sortOrder?: number;
    autoDeductInventory?: boolean;
    internalOnly?: boolean;
}
export declare class UpdateCategoryDto {
    name?: string;
    sortOrder?: number;
    autoDeductInventory?: boolean;
    internalOnly?: boolean;
}
export {};
