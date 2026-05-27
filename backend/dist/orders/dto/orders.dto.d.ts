import { OrderChannel, PaymentMethod } from '@prisma/client';
export declare class SelectedOptionDto {
    optionId: string;
    values: string[];
}
export declare class CreateOrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string;
    selectedOptions?: SelectedOptionDto[];
}
export declare class CreateOrderDto {
    branchId: string;
    channel: OrderChannel;
    paymentMethod?: PaymentMethod;
    customerId?: string;
    guestName?: string;
    notes?: string;
    raffleAccessCode?: string;
    items: CreateOrderItemDto[];
}
export declare class UpdateOrderStatusDto {
    status: string;
}
export declare class UpdateOrderItemsDto {
    items: CreateOrderItemDto[];
}
export declare class PayOrderDto {
    paymentMethod: PaymentMethod;
    paymentLabel?: string;
    receiptUrl?: string;
    customerId?: string;
    redeemPoints?: number;
    promotionId?: string;
    raffleAccessCode?: string;
}
export declare class AddOrderItemDto {
    menuItemId: string;
    quantity: number;
    notes?: string;
    selectedOptions?: SelectedOptionDto[];
}
