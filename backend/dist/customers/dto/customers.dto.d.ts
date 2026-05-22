export declare class CreateCustomerDto {
    name: string;
    phone?: string;
    email?: string;
    birthday?: string;
}
export declare class UpdateCustomerDto {
    name?: string;
    phone?: string;
    email?: string;
    birthday?: string;
}
export declare class SendSmsDto {
    customerIds: string[];
    message: string;
}
export declare class CreateSegmentDto {
    name: string;
    lastSeenBefore?: string;
    minVisits?: number;
    maxVisits?: number;
}
