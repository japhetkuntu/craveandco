export declare class CreateCustomerDto {
    name: string;
    phone?: string;
    email?: string;
    birthday?: string;
}
export declare class CreateSegmentDto {
    name: string;
    lastSeenBefore?: string;
    minVisits?: number;
    maxVisits?: number;
}
