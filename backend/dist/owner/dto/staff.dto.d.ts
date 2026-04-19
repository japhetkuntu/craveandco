import { Role } from '@prisma/client';
export declare class CreateStaffDto {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: Role;
}
export declare class UpdateStaffDto {
    name?: string;
    email?: string;
    phone?: string;
    role?: Role;
    active?: boolean;
}
