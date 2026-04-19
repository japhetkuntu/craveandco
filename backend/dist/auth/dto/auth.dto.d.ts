import { Role } from '@prisma/client';
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RegisterDto {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: Role;
    branchId: string;
}
export declare class RefreshDto {
    refreshToken: string;
}
