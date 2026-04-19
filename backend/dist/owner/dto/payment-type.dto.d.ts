import { PaymentMethod } from '@prisma/client';
export declare class CreatePaymentTypeDto {
    name: string;
    method: PaymentMethod;
}
export declare class UpdatePaymentTypeDto {
    name?: string;
    method?: PaymentMethod;
    active?: boolean;
}
