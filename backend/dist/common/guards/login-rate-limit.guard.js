"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoginRateLimitGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
let LoginRateLimitGuard = class LoginRateLimitGuard {
    static { LoginRateLimitGuard_1 = this; }
    static storage = new Map();
    static MAX_ATTEMPTS = 10;
    static WINDOW_MS = 60_000;
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
        const key = String(ip);
        const now = Date.now();
        const entry = LoginRateLimitGuard_1.storage.get(key) || { count: 0, firstRequestAt: now };
        if (now - entry.firstRequestAt > LoginRateLimitGuard_1.WINDOW_MS) {
            entry.count = 0;
            entry.firstRequestAt = now;
        }
        entry.count += 1;
        LoginRateLimitGuard_1.storage.set(key, entry);
        if (entry.count > LoginRateLimitGuard_1.MAX_ATTEMPTS) {
            throw new common_1.HttpException('Too many login attempts. Please try again in a minute.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.LoginRateLimitGuard = LoginRateLimitGuard;
exports.LoginRateLimitGuard = LoginRateLimitGuard = LoginRateLimitGuard_1 = __decorate([
    (0, common_1.Injectable)()
], LoginRateLimitGuard);
//# sourceMappingURL=login-rate-limit.guard.js.map