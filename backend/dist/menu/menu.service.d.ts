import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateMenuItemDto, UpdateMenuItemDto, CreateCategoryDto, UpdateCategoryDto } from './dto/menu.dto';
export declare class MenuService {
    private prisma;
    private files;
    private readonly groupedComponentsOptionId;
    constructor(prisma: PrismaService, files: FilesService);
    private splitVisibleAndHiddenOptions;
    private toPublicMenuItem;
    createCategory(dto: CreateCategoryDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        autoDeductInventory: boolean;
        internalOnly: boolean;
    }>;
    findCategories(page?: number, limit?: number, excludeInternalOnly?: boolean): Promise<({
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
        autoDeductInventory: boolean;
        internalOnly: boolean;
    })[]>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        autoDeductInventory: boolean;
        internalOnly: boolean;
    }>;
    deleteCategory(id: string): Promise<{
        name: string;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        sortOrder: number;
        autoDeductInventory: boolean;
        internalOnly: boolean;
    }>;
    createItem(branchId: string, dto: CreateMenuItemDto): Promise<{
        category: {
            name: string;
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            autoDeductInventory: boolean;
            internalOnly: boolean;
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
    findItems(branchId: string, categoryId?: string, page?: number, limit?: number, excludeInternalOnly?: boolean): Promise<({
        category: {
            name: string;
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            sortOrder: number;
            autoDeductInventory: boolean;
            internalOnly: boolean;
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
            autoDeductInventory: boolean;
            internalOnly: boolean;
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
