import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private connected;
    private readonly retryAttempts;
    private readonly retryDelayMs;
    private readonly defaultAdminDatabase;
    constructor();
    private delay;
    private parseDatabaseUrl;
    private ensureDatabaseExists;
    private isRetryableError;
    private connectWithRetry;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
