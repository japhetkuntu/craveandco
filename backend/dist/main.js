"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const prisma_service_1 = require("./prisma/prisma.service");
const sanitize_pipe_1 = require("./common/pipes/sanitize.pipe");
async function ensureDefaultOwner(prisma) {
    const ownerEmail = process.env.DEFAULT_OWNER_EMAIL || 'ceo@craveandco.com';
    const ownerName = process.env.DEFAULT_OWNER_NAME || 'Japhet Kuntu Blankson';
    const ownerPassword = process.env.DEFAULT_OWNER_PASSWORD || 'Japhet1998@';
    const branchName = process.env.DEFAULT_BRANCH_NAME || 'Crave & Co Branch';
    let branch = await prisma.branch.findFirst({ where: { name: branchName } });
    if (!branch) {
        branch = await prisma.branch.create({
            data: {
                name: branchName,
                location: 'Accra',
                timezone: 'Africa/Accra',
                currency: 'GHS',
            },
        });
        console.log(`📦 Created default branch: ${branchName}`);
    }
    const owner = await prisma.user.findFirst({
        where: {
            OR: [{ email: ownerEmail }, { role: client_1.Role.OWNER }],
        },
    });
    if (!owner) {
        const passwordHash = await bcrypt.hash(ownerPassword, 12);
        await prisma.user.create({
            data: {
                name: ownerName,
                email: ownerEmail,
                passwordHash,
                role: client_1.Role.OWNER,
                branchId: branch.id,
            },
        });
        console.log(`🔐 Default owner created: ${ownerEmail} / ${ownerPassword}`);
    }
    else {
        console.log(`✅ Owner already exists: ${owner.email}`);
    }
}
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new sanitize_pipe_1.SanitizePipe(), new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    });
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Crave Portal API')
        .setDescription('API documentation for Crave and Co portal')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
    }, 'access-token')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api-docs', app, document);
    await app.init();
    const prisma = app.get(prisma_service_1.PrismaService);
    await ensureDefaultOwner(prisma);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT') || 4000;
    await app.listen(port);
    console.log(`🚀 Crave Portal API running on http://localhost:${port}`);
    console.log(`📘 Swagger docs available at http://localhost:${port}/api-docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map