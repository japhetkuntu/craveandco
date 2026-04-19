import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderItemsDto, PayOrderDto, AddOrderItemDto } from './dto/orders.dto';
export declare class OrdersController {
    private orders;
    constructor(orders: OrdersService);
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
            totalSpend: import("@prisma/client/runtime/library").Decimal;
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
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
            };
            ingredientCosts: {
                id: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                ingredientId: string;
                unitCost: import("@prisma/client/runtime/library").Decimal;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: import("@prisma/client/runtime/library").Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
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
        total: import("@prisma/client/runtime/library").Decimal;
        foodCost: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
    findLive(branchId: string, page?: string, limit?: string): Promise<any[]>;
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
            totalSpend: import("@prisma/client/runtime/library").Decimal;
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
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
            };
            ingredientCosts: {
                id: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                ingredientId: string;
                unitCost: import("@prisma/client/runtime/library").Decimal;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: import("@prisma/client/runtime/library").Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
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
        total: import("@prisma/client/runtime/library").Decimal;
        foodCost: import("@prisma/client/runtime/library").Decimal;
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
            totalSpend: import("@prisma/client/runtime/library").Decimal;
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
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
            };
            ingredientCosts: {
                id: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                ingredientId: string;
                unitCost: import("@prisma/client/runtime/library").Decimal;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: import("@prisma/client/runtime/library").Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
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
        total: import("@prisma/client/runtime/library").Decimal;
        foodCost: import("@prisma/client/runtime/library").Decimal;
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
            totalSpend: import("@prisma/client/runtime/library").Decimal;
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
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
            };
            ingredientCosts: {
                id: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                ingredientId: string;
                unitCost: import("@prisma/client/runtime/library").Decimal;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: import("@prisma/client/runtime/library").Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
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
        total: import("@prisma/client/runtime/library").Decimal;
        foodCost: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
    removeItem(id: string, itemId: string): Promise<{
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
            totalSpend: import("@prisma/client/runtime/library").Decimal;
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
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
            };
            ingredientCosts: {
                id: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                ingredientId: string;
                unitCost: import("@prisma/client/runtime/library").Decimal;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: import("@prisma/client/runtime/library").Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
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
        total: import("@prisma/client/runtime/library").Decimal;
        foodCost: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
    pay(id: string, dto: PayOrderDto): Promise<any>;
    findAll(branchId: string, status?: string, channel?: string, paymentMethod?: string, from?: string, to?: string, search?: string, page?: string, limit?: string): Promise<any[]>;
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
            totalSpend: import("@prisma/client/runtime/library").Decimal;
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
                categoryId: string;
                description: string | null;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                available: boolean;
                dayparts: string[];
            };
            ingredientCosts: {
                id: string;
                quantity: import("@prisma/client/runtime/library").Decimal;
                ingredientId: string;
                unitCost: import("@prisma/client/runtime/library").Decimal;
                ingredientName: string;
                ingredientUnit: string;
                totalCost: import("@prisma/client/runtime/library").Decimal;
                orderItemId: string;
            }[];
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
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
        total: import("@prisma/client/runtime/library").Decimal;
        foodCost: import("@prisma/client/runtime/library").Decimal;
        paidAt: Date | null;
    }>;
}
