import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { FilesService } from '../files/files.service';
import { CreateHandoverNoteDto } from './dto/kitchen.dto';
export declare class KitchenService {
    private prisma;
    private alerts;
    private files;
    constructor(prisma: PrismaService, alerts: AlertsService, files: FilesService);
    private attachImageUrlsToKitchenOrder;
    getLiveOrders(branchId: string, station?: string, page?: number, limit?: number): Promise<any[]>;
    private isValidOrderStatus;
    updateOrderStatus(orderId: string, status: string): Promise<any>;
    getPrepList(branchId: string, date: string, shift?: string, page?: number, limit?: number): Promise<{
        menuItemId: string;
        menuItem: string;
        totalQuantity: number;
    }[]>;
    createShortageRequest(ingredientId: string, branchId: string, reason?: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        type: import("@prisma/client").$Enums.MovementType;
        ingredientId: string;
        reason: string | null;
        referenceId: string | null;
    }>;
    logWaste(ingredientId: string, branchId: string, quantity: number, reason?: string): Promise<{
        branchId: string;
        id: string;
        createdAt: Date;
        quantity: import("@prisma/client/runtime/library").Decimal;
        type: import("@prisma/client").$Enums.MovementType;
        ingredientId: string;
        reason: string | null;
        referenceId: string | null;
    }>;
    getWasteLogs(branchId: string, page?: number, limit?: number): Promise<({
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
    getHandoverNotes(date?: string, shift?: string, page?: number, limit?: number): Promise<({
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
        date: Date;
        content: string;
    })[]>;
    createHandoverNote(userId: string, dto: CreateHandoverNoteDto): Promise<{
        shift: import("@prisma/client").$Enums.ShiftSlot;
        id: string;
        createdAt: Date;
        userId: string;
        date: Date;
        content: string;
    }>;
    getStationLoad(branchId: string, page?: number, limit?: number): Promise<{
        station: string;
        count: number;
    }[]>;
}
