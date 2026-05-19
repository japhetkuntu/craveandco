import { MenuService } from './menu.service';
import { CreateMenuItemDto, UpdateMenuItemDto, CreateCategoryDto, UpdateCategoryDto } from './dto/menu.dto';
export declare class MenuController {
    private menu;
    constructor(menu: MenuService);
    createCategory(dto: CreateCategoryDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    findCategories(page?: string, limit?: string): Promise<({
        items: {
            name: string;
            branchId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            imageKey: string | null;
            available: boolean;
            dayparts: string[];
            options: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
    } & {
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    })[]>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    deleteCategory(id: string): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    createItem(branchId: string, dto: CreateMenuItemDto): Promise<{
        category: {
            name: string;
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
        };
    } & {
        name: string;
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        imageKey: string | null;
        available: boolean;
        dayparts: string[];
        options: import("@prisma/client/runtime/library").JsonValue | null;
    } & {
        options: any[];
        groupedComponentIds: string[];
        imageUrl: string | null;
    }>;
    findItems(branchId: string, categoryId?: string, page?: string, limit?: string): Promise<({
        category: {
            name: string;
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
        };
    } & {
        name: string;
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        imageKey: string | null;
        available: boolean;
        dayparts: string[];
        options: import("@prisma/client/runtime/library").JsonValue | null;
    } & {
        options: any[];
        groupedComponentIds: string[];
        imageUrl: string | null;
    })[]>;
    updateItem(id: string, dto: UpdateMenuItemDto): Promise<{
        category: {
            name: string;
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
        };
    } & {
        name: string;
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        imageKey: string | null;
        available: boolean;
        dayparts: string[];
        options: import("@prisma/client/runtime/library").JsonValue | null;
    } & {
        options: any[];
        groupedComponentIds: string[];
        imageUrl: string | null;
    }>;
    deleteItem(id: string): Promise<{
        name: string;
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        imageKey: string | null;
        available: boolean;
        dayparts: string[];
        options: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    toggleAvailability(id: string): Promise<{
        name: string;
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        imageKey: string | null;
        available: boolean;
        dayparts: string[];
        options: import("@prisma/client/runtime/library").JsonValue | null;
    } & {
        options: any[];
        groupedComponentIds: string[];
        imageUrl: string | null;
    }>;
}
