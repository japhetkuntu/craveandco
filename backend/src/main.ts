import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function ensureDefaultOwner(prisma: PrismaService) {
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
      OR: [{ email: ownerEmail }, { role: Role.OWNER }],
    },
  });

  if (!owner) {
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    await prisma.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        passwordHash,
        role: Role.OWNER,
        branchId: branch.id,
      },
    });
    console.log(`🔐 Default owner created: ${ownerEmail} / ${ownerPassword}`);
  } else {
    console.log(`✅ Owner already exists: ${owner.email}`);
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN ||
    'http://localhost:3000,https://crave-and-co-portal.netlify.app,https://staff.reservease.com';
  const allowedOrigins = corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Crave Portal API')
    .setDescription('API documentation for Crave and Co portal')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    }, 'access-token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.init();

  const prisma = app.get(PrismaService);
  await ensureDefaultOwner(prisma);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);
  console.log(`🚀 Crave Portal API running on http://localhost:${port}`);
  console.log(`📘 Swagger docs available at http://localhost:${port}/api-docs`);
}
bootstrap();
