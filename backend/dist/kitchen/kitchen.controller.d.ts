import { KitchenService } from './kitchen.service';
import { CreateHandoverNoteDto, CreateShortageRequestDto, CreateWasteLogDto, UpdateKitchenOrderDto } from './dto/kitchen.dto';
export declare class KitchenController {
    private kitchen;
    constructor(kitchen: KitchenService);
    getLiveOrders(branchId: string, station?: string, page?: string, limit?: string): Promise<any[]>;
    updateOrderStatus(orderId: string, dto: UpdateKitchenOrderDto): Promise<any>;
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
        type: import("@prisma/client").$Enums.MovementType;
        ingredientId: string;
        reason: string | null;
        referenceId: string | null;
    }>;
    logWaste(branchId: string, dto: CreateWasteLogDto): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        type: import("@prisma/client").$Enums.MovementType;
        ingredientId: string;
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
        type: import("@prisma/client").$Enums.MovementType;
        ingredientId: string;
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
