import { OrderStatus, ShiftSlot } from '@prisma/client';
export declare class UpdateKitchenOrderDto {
    status: OrderStatus;
}
export declare class CreateShortageRequestDto {
    ingredientId: string;
    reason?: string;
}
export declare class CreateWasteLogDto {
    ingredientId: string;
    quantity: number;
    reason?: string;
}
export declare class MarkDelayedDto {
    reason?: string;
}
export declare class CreateHandoverNoteDto {
    shift: ShiftSlot;
    content: string;
}
