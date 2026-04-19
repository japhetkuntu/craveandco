"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
let PrismaService = class PrismaService extends client_1.PrismaClient {
    connected = false;
    retryAttempts = parseInt(process.env.DB_CONNECTION_RETRY_ATTEMPTS || '10', 10);
    retryDelayMs = parseInt(process.env.DB_CONNECTION_RETRY_DELAY_MS || '1000', 10);
    defaultAdminDatabase = process.env.PG_DEFAULT_DB || 'postgres';
    constructor() {
        super();
    }
    async delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    parseDatabaseUrl() {
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
    async ensureDatabaseExists() {
        const { adminConnectionString, database } = this.parseDatabaseUrl();
        let attempt = 0;
        while (attempt < this.retryAttempts) {
            attempt += 1;
            const client = new pg_1.Client({ connectionString: adminConnectionString });
            try {
                await client.connect();
                const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
                if (rows.length === 0) {
                    const safeName = database.replace(/"/g, '""');
                    await client.query(`CREATE DATABASE "${safeName}" WITH ENCODING='UTF8' TEMPLATE=template0`);
                    console.log(`📦 Created database ${database}`);
                }
                await client.end();
                return;
            }
            catch (error) {
                await client.end().catch(() => null);
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`⚠️ Database creation attempt ${attempt}/${this.retryAttempts} failed: ${message}`);
                if (attempt >= this.retryAttempts || !this.isRetryableError(error)) {
                    break;
                }
                await this.delay(this.retryDelayMs);
            }
        }
        throw new Error(`Unable to create or connect to the database after ${this.retryAttempts} attempts. Check that PostgreSQL is running and DATABASE_URL is valid.`);
    }
    isRetryableError(error) {
        if (!(error instanceof Error))
            return true;
        const message = error.message.toLowerCase();
        return (message.includes('does not exist') ||
            message.includes('prismaclientinitializationerror') ||
            message.includes('connection refused') ||
            message.includes('connect') ||
            message.includes('timeout') ||
            message.includes('failed to connect') ||
            message.includes('econnrefused'));
    }
    async connectWithRetry() {
        let attempt = 0;
        let lastError;
        while (attempt < this.retryAttempts) {
            try {
                attempt += 1;
                await this.$connect();
                this.connected = true;
                return;
            }
            catch (error) {
                lastError = error;
                const message = error instanceof Error ? error.message : String(error);
                console.warn(`⚠️ Prisma connection attempt ${attempt}/${this.retryAttempts} failed: ${message}`);
                if (attempt >= this.retryAttempts || !this.isRetryableError(error)) {
                    break;
                }
                await this.delay(this.retryDelayMs);
            }
        }
        throw new Error(`Database unavailable after ${this.retryAttempts} attempts. Ensure the database is running and that DATABASE_URL is correct.`);
    }
    async onModuleInit() {
        await this.ensureDatabaseExists();
        await this.connectWithRetry();
    }
    async onModuleDestroy() {
        if (!this.connected)
            return;
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map