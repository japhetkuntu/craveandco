import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Client } from 'pg';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execFileAsync = promisify(execFile);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private connected = false;
  private readonly retryAttempts = parseInt(process.env.DB_CONNECTION_RETRY_ATTEMPTS || '10', 10);
  private readonly retryDelayMs = parseInt(process.env.DB_CONNECTION_RETRY_DELAY_MS || '1000', 10);
  private readonly defaultAdminDatabase = process.env.PG_DEFAULT_DB || 'postgres';

  constructor() {
    super();
  }

  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parseDatabaseUrl() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables.');
    }

    const parsed = new URL(databaseUrl);
    const database = parsed.pathname?.slice(1);
    if (!database) {
      throw new Error('DATABASE_URL does not include a database name.');
    }

    const adminUrl = new URL(databaseUrl);
    adminUrl.pathname = `/${this.defaultAdminDatabase}`;

    return {
      adminConnectionString: adminUrl.toString(),
      database,
    };
  }

  private async ensureDatabaseExists() {
    const { adminConnectionString, database } = this.parseDatabaseUrl();
    let attempt = 0;

    while (attempt < this.retryAttempts) {
      attempt += 1;
      const client = new Client({ connectionString: adminConnectionString });
      try {
        await client.connect();
        const { rows } = await client.query(
          'SELECT 1 FROM pg_database WHERE datname = $1',
          [database],
        );

        if (rows.length === 0) {
          const safeName = database.replace(/"/g, '""');
          await client.query(`CREATE DATABASE "${safeName}" WITH ENCODING='UTF8' TEMPLATE=template0`);
          console.log(`📦 Created database ${database}`);
        }

        await client.end();
        return;
      } catch (error: unknown) {
        await client.end().catch(() => null);
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Database creation attempt ${attempt}/${this.retryAttempts} failed: ${message}`);

        if (attempt >= this.retryAttempts || !this.isRetryableError(error)) {
          break;
        }

        await this.delay(this.retryDelayMs);
      }
    }

    throw new Error(
      `Unable to create or connect to the database after ${this.retryAttempts} attempts. Check that PostgreSQL is running and DATABASE_URL is valid.`,
    );
  }

  private isRetryableError(error: unknown) {
    if (!(error instanceof Error)) return true;
    const message = error.message.toLowerCase();
    return (
      message.includes('does not exist') ||
      message.includes('prismaclientinitializationerror') ||
      message.includes('connection refused') ||
      message.includes('connect') ||
      message.includes('timeout') ||
      message.includes('failed to connect') ||
      message.includes('econnrefused')
    );
  }

  private async connectWithRetry() {
    let attempt = 0;
    let lastError: unknown;

    while (attempt < this.retryAttempts) {
      try {
        attempt += 1;
        await this.$connect();
        this.connected = true;
        return;
      } catch (error: unknown) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Prisma connection attempt ${attempt}/${this.retryAttempts} failed: ${message}`);

        if (attempt >= this.retryAttempts || !this.isRetryableError(error)) {
          break;
        }

        await this.delay(this.retryDelayMs);
      }
    }

    throw new Error(
      `Database unavailable after ${this.retryAttempts} attempts. Ensure the database is running and that DATABASE_URL is correct.`,
    );
  }

  async onModuleInit() {
    await this.ensureDatabaseExists();
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    if (!this.connected) return;
    await this.$disconnect();
  }
}
