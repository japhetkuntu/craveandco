export declare class CreateMenuItemDto {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    imageUrl?: string;
    available?: boolean;
    dayparts?: string[];
}
export declare class UpdateMenuItemDto {
    name?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    available?: boolean;
    dayparts?: string[];
}
export declare class CreateCategoryDto {
    name: string;
    sortOrder?: number;
}
export declare class UpdateCategoryDto {
    name?: string;
    sortOrder?: number;
}
