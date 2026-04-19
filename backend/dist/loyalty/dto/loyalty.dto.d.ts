import { LoyaltyTxType } from '@prisma/client';
export declare class CreateLoyaltyTxDto {
    customerId: string;
    points: number;
    type: LoyaltyTxType;
    reference?: string;
}
