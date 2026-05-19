import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerRegisterDto, CustomerLoginDto, RefreshDto } from './dto/auth.dto';

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: CustomerRegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim();

    try {
      const customer = await this.prisma.customer.create({
        data: {
          name: dto.name,
          email,
          phone,
        },
      });

      await this.prisma.customerAccount.create({
        data: {
          customerId: customer.id,
          email,
          phone,
          passwordHash: await bcrypt.hash(dto.password, 12),
          active: true,
        },
      });

      return this.issueTokens(customer.id, { email, name: dto.name });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('A customer with that email or phone already exists.');
      }
      throw error;
    }
  }

  async login(dto: CustomerLoginDto) {
    const loginValue = dto.emailOrPhone.trim().toLowerCase();
    const account = await this.prisma.customerAccount.findFirst({
      where: {
        OR: [{ email: loginValue }, { phone: loginValue }],
      },
      include: { customer: true },
    });

    if (!account || !account.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, account.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(account.customerId, { email: account.email ?? loginValue, name: account.customer.name });
  }

  async refresh(dto: RefreshDto) {
    const tokenHash = this.hashToken(dto.refreshToken);
    const stored = await this.prisma.customerRefreshToken.findUnique({
      where: { tokenHash },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.customerRefreshToken.deleteMany({ where: { id: stored.id } });

    const customer = await this.prisma.customer.findUnique({
      where: { id: stored.customerId },
    });
    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    return this.issueTokens(customer.id, { email: customer.email ?? undefined, name: customer.name });
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.customerRefreshToken.deleteMany({ where: { tokenHash } });
    return { message: 'Logged out' };
  }

  private async issueTokens(customerId: string, payload: { email?: string; name: string }) {
    const authPayload = { sub: customerId, email: payload.email, name: payload.name };
    const accessToken = this.jwt.sign(authPayload, {
      expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
    });
    const refreshToken = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.customerRefreshToken.create({
      data: {
        customerId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
