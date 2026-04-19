export declare class PurchaseOrderItemDto {
    ingredientId: string;
    quantity: number;
    unitCost: number;
}
export declare class CreatePurchaseOrderDto {
    branchId: string;
    supplierId: string;
    notes?: string;
    items: PurchaseOrderItemDto[];
}
export declare class ReceiveItemDto {
    purchaseOrderItemId: string;
    receivedQty: number;
}
export declare class ReceivePurchaseOrderDto {
    items: ReceiveItemDto[];
}
export declare class CreateSupplierDto {
    name: string;
    phone?: string;
    email?: string;
    paymentTerms?: string;
}
