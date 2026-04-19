import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemDto, UpdateMenuItemDto, CreateCategoryDto, UpdateCategoryDto } from './dto/menu.dto';
export declare class MenuService {
    private prisma;
    constructor(prisma: PrismaService);
    createCategory(dto: CreateCategoryDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
    }>;
    findCategories(page?: number, limit?: number): Promise<({
        items: {
            name: string;
            branchId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            description: string | null;
            price: import("@prisma/client/runtime/library").Decimal;
            imageUrl: string | null;
            available: boolean;
            dayparts: string[];
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
        imageUrl: string | null;
        available: boolean;
        dayparts: string[];
    }>;
    findItems(branchId: string, categoryId?: string, page?: number, limit?: number): Promise<({
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
        imageUrl: string | null;
        available: boolean;
        dayparts: string[];
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
        imageUrl: string | null;
        available: boolean;
        dayparts: string[];
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
        imageUrl: string | null;
        available: boolean;
        dayparts: string[];
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
        imageUrl: string | null;
        available: boolean;
        dayparts: string[];
    }>;
}
