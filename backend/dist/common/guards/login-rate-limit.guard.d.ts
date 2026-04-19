import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class LoginRateLimitGuard implements CanActivate {
    private static readonly storage;
    private static readonly MAX_ATTEMPTS;
    private static readonly WINDOW_MS;
    canActivate(context: ExecutionContext): boolean;
}
