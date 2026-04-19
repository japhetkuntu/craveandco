import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

interface RateEntry {
  count: number;
  firstRequestAt: number;
}

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private static readonly storage = new Map<string, RateEntry>();
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly WINDOW_MS = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    const key = String(ip);
    const now = Date.now();
    const entry = LoginRateLimitGuard.storage.get(key) || { count: 0, firstRequestAt: now };

    if (now - entry.firstRequestAt > LoginRateLimitGuard.WINDOW_MS) {
      entry.count = 0;
      entry.firstRequestAt = now;
    }

    entry.count += 1;
    LoginRateLimitGuard.storage.set(key, entry);

    if (entry.count > LoginRateLimitGuard.MAX_ATTEMPTS) {
      throw new HttpException('Too many login attempts. Please try again in a minute.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
