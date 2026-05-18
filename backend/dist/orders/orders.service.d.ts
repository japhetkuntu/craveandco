import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemsDto, PayOrderDto, AddOrderItemDto } from './dto/orders.dto';
import { Prisma } from '@prisma/client';
import { PromotionsService } from '../promotions/promotions.service';
export declare class OrdersService {
    private prisma;
    private promotions;
    constructor(prisma: PrismaService, promotions: PromotionsService);
    private orderInclude;
    private readonly groupedComponentsOptionId;
    private getGroupedComponentIds;
    private mergeIngredientCosts;
    private resolveIngredientCostsForMenuItem;
    private loadMenuItemsWithCosts;
    private getSelectedOptionAdjustment;
    private calculateMenuItemPrice;
    private normalizeSelectedOptions;
    private calculateTotals;
    create(dto: CreateOrderDto): Promise<{
        customer: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            birthday: Date | null;
            firstSeenAt: Date;
            lastSeenAt: Date;
            totalSpend: Prisma.Decimal;
            visitCount: number;
        } | null;
        items: ({
            menuItem: {
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
                description: string | null;
                categoryId: string;
                price: Prisma.Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
                options: Prisma.JsonValue | null;
            };
            ingredientCosts: {
                id: string;
                quantity: Prisma.Decimal;
                unitCost: Prisma.Decimal;
                ingredientId: string;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: Prisma.Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            selectedOptions: Prisma.JsonValue | null;
            orderId: string;
            unitPrice: Prisma.Decimal;
            unitCost: Prisma.Decimal;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        channel: import("@prisma/client").$Enums.OrderChannel;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        customerId: string | null;
        guestName: string | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        paymentLabel: string | null;
        receiptUrl: string | null;
        promotionId: string | null;
        total: Prisma.Decimal;
        foodCost: Prisma.Decimal;
        paidAt: Date | null;
    }>;
    private enrichOrder;
    findOne(id: string): Promise<any>;
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<{
        customer: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            birthday: Date | null;
            firstSeenAt: Date;
            lastSeenAt: Date;
            totalSpend: Prisma.Decimal;
            visitCount: number;
        } | null;
        items: ({
            menuItem: {
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
                description: string | null;
                categoryId: string;
                price: Prisma.Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
                options: Prisma.JsonValue | null;
            };
            ingredientCosts: {
                id: string;
                quantity: Prisma.Decimal;
                unitCost: Prisma.Decimal;
                ingredientId: string;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: Prisma.Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            selectedOptions: Prisma.JsonValue | null;
            orderId: string;
            unitPrice: Prisma.Decimal;
            unitCost: Prisma.Decimal;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        channel: import("@prisma/client").$Enums.OrderChannel;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        customerId: string | null;
        guestName: string | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        paymentLabel: string | null;
        receiptUrl: string | null;
        promotionId: string | null;
        total: Prisma.Decimal;
        foodCost: Prisma.Decimal;
        paidAt: Date | null;
    }>;
    updateItems(id: string, dto: UpdateOrderItemsDto): Promise<{
        customer: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            birthday: Date | null;
            firstSeenAt: Date;
            lastSeenAt: Date;
            totalSpend: Prisma.Decimal;
            visitCount: number;
        } | null;
        items: ({
            menuItem: {
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
                description: string | null;
                categoryId: string;
                price: Prisma.Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
                options: Prisma.JsonValue | null;
            };
            ingredientCosts: {
                id: string;
                quantity: Prisma.Decimal;
                unitCost: Prisma.Decimal;
                ingredientId: string;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: Prisma.Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            selectedOptions: Prisma.JsonValue | null;
            orderId: string;
            unitPrice: Prisma.Decimal;
            unitCost: Prisma.Decimal;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        channel: import("@prisma/client").$Enums.OrderChannel;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        customerId: string | null;
        guestName: string | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        paymentLabel: string | null;
        receiptUrl: string | null;
        promotionId: string | null;
        total: Prisma.Decimal;
        foodCost: Prisma.Decimal;
        paidAt: Date | null;
    }>;
    addItem(id: string, dto: AddOrderItemDto): Promise<{
        customer: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            birthday: Date | null;
            firstSeenAt: Date;
            lastSeenAt: Date;
            totalSpend: Prisma.Decimal;
            visitCount: number;
        } | null;
        items: ({
            menuItem: {
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
                description: string | null;
                categoryId: string;
                price: Prisma.Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
                options: Prisma.JsonValue | null;
            };
            ingredientCosts: {
                id: string;
                quantity: Prisma.Decimal;
                unitCost: Prisma.Decimal;
                ingredientId: string;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: Prisma.Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            selectedOptions: Prisma.JsonValue | null;
            orderId: string;
            unitPrice: Prisma.Decimal;
            unitCost: Prisma.Decimal;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        channel: import("@prisma/client").$Enums.OrderChannel;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        customerId: string | null;
        guestName: string | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        paymentLabel: string | null;
        receiptUrl: string | null;
        promotionId: string | null;
        total: Prisma.Decimal;
        foodCost: Prisma.Decimal;
        paidAt: Date | null;
    }>;
    removeItem(orderId: string, itemId: string): Promise<{
        customer: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            birthday: Date | null;
            firstSeenAt: Date;
            lastSeenAt: Date;
            totalSpend: Prisma.Decimal;
            visitCount: number;
        } | null;
        items: ({
            menuItem: {
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
                description: string | null;
                categoryId: string;
                price: Prisma.Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
                options: Prisma.JsonValue | null;
            };
            ingredientCosts: {
                id: string;
                quantity: Prisma.Decimal;
                unitCost: Prisma.Decimal;
                ingredientId: string;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: Prisma.Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            selectedOptions: Prisma.JsonValue | null;
            orderId: string;
            unitPrice: Prisma.Decimal;
            unitCost: Prisma.Decimal;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        channel: import("@prisma/client").$Enums.OrderChannel;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        customerId: string | null;
        guestName: string | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        paymentLabel: string | null;
        receiptUrl: string | null;
        promotionId: string | null;
        total: Prisma.Decimal;
        foodCost: Prisma.Decimal;
        paidAt: Date | null;
    }>;
    pay(id: string, dto: PayOrderDto): Promise<any>;
    findLive(branchId: string, page?: number, limit?: number): Promise<any[]>;
    private buildOrderWhere;
    getStats(branchId: string, params: {
        status?: string;
        channel?: string;
        paymentMethod?: string;
        from?: string;
        to?: string;
        search?: string;
        categoryIds?: string[];
    }): Promise<{
        count: number;
        totalRevenue: number;
        foodCost: number;
        avgTicket: number;
    }>;
    findAll(branchId: string, params: {
        status?: string;
        channel?: string;
        paymentMethod?: string;
        from?: string;
        to?: string;
        search?: string;
        categoryIds?: string[];
    }, page?: number, limit?: number): Promise<any[]>;
    cancel(id: string): Promise<{
        customer: {
            email: string | null;
            name: string;
            phone: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            birthday: Date | null;
            firstSeenAt: Date;
            lastSeenAt: Date;
            totalSpend: Prisma.Decimal;
            visitCount: number;
        } | null;
        items: ({
            menuItem: {
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
                description: string | null;
                categoryId: string;
                price: Prisma.Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
                options: Prisma.JsonValue | null;
            };
            ingredientCosts: {
                id: string;
                quantity: Prisma.Decimal;
                unitCost: Prisma.Decimal;
                ingredientId: string;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: Prisma.Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            selectedOptions: Prisma.JsonValue | null;
            orderId: string;
            unitPrice: Prisma.Decimal;
            unitCost: Prisma.Decimal;
        })[];
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        channel: import("@prisma/client").$Enums.OrderChannel;
        paymentMethod: import("@prisma/client").$Enums.PaymentMethod | null;
        customerId: string | null;
        guestName: string | null;
        status: import("@prisma/client").$Enums.OrderStatus;
        paymentLabel: string | null;
        receiptUrl: string | null;
        promotionId: string | null;
        total: Prisma.Decimal;
        foodCost: Prisma.Decimal;
        paidAt: Date | null;
    }>;
}
