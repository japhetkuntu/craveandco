import { KitchenService } from './kitchen.service';
import { CreateHandoverNoteDto, CreateShortageRequestDto, CreateWasteLogDto, UpdateKitchenOrderDto } from './dto/kitchen.dto';
export declare class KitchenController {
    private kitchen;
    constructor(kitchen: KitchenService);
    getLiveOrders(branchId: string, station?: string, page?: string, limit?: string): Promise<({
        items: ({
            menuItem: {
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
                options: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            selectedOptions: import("@prisma/client/runtime/library").JsonValue | null;
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
    })[]>;
    updateOrderStatus(orderId: string, dto: UpdateKitchenOrderDto): Promise<{
        items: ({
            menuItem: {
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
                options: import("@prisma/client/runtime/library").JsonValue | null;
            };
        } & {
            id: string;
            menuItemId: string;
            quantity: number;
            notes: string | null;
            selectedOptions: import("@prisma/client/runtime/library").JsonValue | null;
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
    getPrepList(branchId: string, date: string, shift?: string, page?: string, limit?: string): Promise<{
        menuItemId: string;
        menuItem: string;
        totalQuantity: number;
    }[]>;
    createShortageRequest(branchId: string, dto: CreateShortageRequestDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        type: import("@prisma/client").$Enums.MovementType;
        reason: string | null;
        referenceId: string | null;
    }>;
    logWaste(branchId: string, dto: CreateWasteLogDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        type: import("@prisma/client").$Enums.MovementType;
        reason: string | null;
        referenceId: string | null;
    }>;
    getWasteLogs(branchId: string, page?: string, limit?: string): Promise<({
        ingredient: {
            name: string;
            id: string;
            unit: string;
        };
    } & {
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        ingredientId: string;
        type: import("@prisma/client").$Enums.MovementType;
        reason: string | null;
        referenceId: string | null;
    })[]>;
    getHandoverNotes(date?: string, shift?: string, page?: string, limit?: string): Promise<({
        user: {
            name: string;
            role: import("@prisma/client").$Enums.Role;
            id: string;
        };
    } & {
        shift: import("@prisma/client").$Enums.ShiftSlot;
        id: string;
        createdAt: Date;
        userId: string;
        content: string;
        date: Date;
    })[]>;
    createHandoverNote(userId: string, dto: CreateHandoverNoteDto): Promise<{
        shift: import("@prisma/client").$Enums.ShiftSlot;
        id: string;
        createdAt: Date;
        userId: string;
        content: string;
        date: Date;
    }>;
    getStationLoad(branchId: string, page?: string, limit?: string): Promise<{
        station: string;
        count: number;
    }[]>;
}
