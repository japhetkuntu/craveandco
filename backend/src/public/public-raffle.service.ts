import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RaffleRequestOtpDto, RaffleVerifyDto, RaffleSpinDto } from './dto/raffle.dto';

// ─── Reward catalogue ──────────────────────────────────────────────────────────
interface RaffleReward {
  type: string;
  label: string;
  description: string;
  weight: number;
}

const REWARDS: RaffleReward[] = [
  { type: 'FIVE_PERCENT',            label: '5% discount',        description: 'Enjoy 5% off your next order. Valid at the point of sale within 24 hours.',               weight: 45 },
  { type: 'FREE_WATER',              label: 'Free water',          description: 'Receive a complimentary water with your next order. Valid within 24 hours.',               weight: 25 },
  { type: 'TEN_PERCENT',             label: '10% discount',        description: 'Save 10% on your next order. Valid at the point of sale within 24 hours.',                 weight: 20 },
  { type: 'FREE_DELIVERY',           label: 'Free delivery',       description: 'Get free delivery on your next order. Valid within 24 hours.',                            weight:  8 },
  { type: 'FIFTY_PERCENT_FIRST_MEAL',label: '50% off one meal',    description: 'Half price on one meal item (max GHS 25). Valid at the point of sale within 24 hours.',   weight:  2 },
];

const TOTAL_WEIGHT = REWARDS.reduce((s, r) => s + r.weight, 0); // must be 100

const DAILY_SPIN_LIMIT          = 3;
const REWARD_EXPIRY_HOURS       = 24;
const MAX_VERIFY_ATTEMPTS       = 3;
const OTP_RESEND_COOLDOWN_SECS  = 60;

@Injectable()
export class PublicRaffleService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ─── Step 1: Request OTP ───────────────────────────────────────────────────
  async requestOtp(dto: RaffleRequestOtpDto) {
    const phone    = dto.phone?.trim();
    const name     = dto.name?.trim() || 'Crave friend';
    const deviceId = dto.deviceId?.trim();

    if (!phone)    throw new BadRequestException('Phone number is required.');
    if (!deviceId) throw new BadRequestException('Device ID is required.');

    // Device guard: one registration per device per calendar day
    const today = this.todayUtc();
    const existingDevice = await this.prisma.raffleDeviceLog.findUnique({
      where: { deviceId_date: { deviceId, date: today } },
    });
    if (existingDevice && existingDevice.phone !== phone) {
      throw new HttpException(
        'This device has already registered a raffle entry today. Try again tomorrow.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Resend cooldown: 60s per phone
    const existing = await this.prisma.customerRaffleEntry.findUnique({ where: { phone } });
    if (existing?.lastOtpSentAt) {
      const secsSinceLast = (Date.now() - existing.lastOtpSentAt.getTime()) / 1000;
      if (secsSinceLast < OTP_RESEND_COOLDOWN_SECS) {
        const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECS - secsSinceLast);
        throw new HttpException(
          `Please wait ${wait} second${wait !== 1 ? 's' : ''} before requesting another code.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    let entry: { accessCode: string };
    try {
      entry = await this.prisma.customerRaffleEntry.upsert({
        where: { phone },
        update: {
          name,
          lastOtpSentAt: new Date(),
          accessCode:    this.generateAccessCode(),
          verified:      false,
          verifyAttempts: 0,
          verifyLockedAt: null,
        },
        create: {
          phone,
          name,
          accessCode:   this.generateAccessCode(),
          lastOtpSentAt: new Date(),
        },
        select: { accessCode: true },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') return this.requestOtp(dto);
      throw err;
    }

    await this.sendSms(
      phone,
      `Your Crave & Co. raffle code is: ${entry.accessCode}\n\nEnter it on the Spin & Win page to start. Valid today only. Do not share.`,
    );

    const masked = phone.replace(/.(?=.{4})/g, '•');
    return {
      message: `Your access code has been sent to ${masked}. Enter it below to start spinning.`,
      phone: masked,
    };
  }

  // ─── Step 2: Verify OTP ────────────────────────────────────────────────────
  async verifyOtp(dto: RaffleVerifyDto) {
    const phone    = dto.phone?.trim();
    const code     = dto.accessCode?.trim().toUpperCase();
    const deviceId = dto.deviceId?.trim();

    if (!phone || !code) throw new BadRequestException('Phone and access code are required.');
    if (!deviceId)       throw new BadRequestException('Device ID is required.');

    const entry = await this.prisma.customerRaffleEntry.findUnique({ where: { phone } });
    if (!entry) {
      throw new NotFoundException('No raffle entry found for this number. Please request a code first.');
    }

    // Already verified — return session
    if (entry.verified) {
      const sameDay = this.isSameDay(entry.lastSpinAt, new Date());
      const remaining = sameDay ? Math.max(0, DAILY_SPIN_LIMIT - entry.dailySpinCount) : DAILY_SPIN_LIMIT;
      return this.buildSession(entry.accessCode, entry.phone, remaining);
    }

    // Locked (hit max attempts today)
    if (entry.verifyLockedAt && this.isSameDay(entry.verifyLockedAt, new Date())) {
      throw new BadRequestException(
        'Too many incorrect attempts. Your entry is locked for today. Request a new code tomorrow.',
      );
    }

    // Wrong code
    if (entry.accessCode !== code) {
      const newAttempts = entry.verifyAttempts + 1;
      const remaining   = MAX_VERIFY_ATTEMPTS - newAttempts;
      await this.prisma.customerRaffleEntry.update({
        where: { id: entry.id },
        data: {
          verifyAttempts: newAttempts,
          verifyLockedAt: newAttempts >= MAX_VERIFY_ATTEMPTS ? new Date() : null,
        },
      });
      if (remaining <= 0) {
        throw new BadRequestException(
          'Incorrect code. You have used all 3 attempts. Request a new code tomorrow.',
        );
      }
      throw new BadRequestException(
        `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      );
    }

    // ── Correct — verify, auto-create customer, record device ─────────────────
    let customerId = entry.customerId;
    if (!customerId) {
      const existing = await this.prisma.customer.findUnique({ where: { phone } });
      if (existing) {
        customerId = existing.id;
      } else {
        const created = await this.prisma.customer.create({
          data: { phone, name: entry.name },
        });
        customerId = created.id;
      }
    }

    const today = this.todayUtc();
    await this.prisma.$transaction([
      this.prisma.customerRaffleEntry.update({
        where: { id: entry.id },
        data: { verified: true, verifyAttempts: 0, verifyLockedAt: null, customerId },
      }),
      this.prisma.raffleDeviceLog.upsert({
        where:  { deviceId_date: { deviceId, date: today } },
        update: {},
        create: { deviceId, date: today, phone },
      }),
    ]);

    const sameDay  = this.isSameDay(entry.lastSpinAt, new Date());
    const remaining = sameDay ? Math.max(0, DAILY_SPIN_LIMIT - entry.dailySpinCount) : DAILY_SPIN_LIMIT;
    return this.buildSession(entry.accessCode, entry.phone, remaining, "You're in! Tap Spin to reveal your reward.");
  }

  // ─── Step 3: Spin ─────────────────────────────────────────────────────────
  async spin(dto: RaffleSpinDto) {
    const accessCode = dto.accessCode?.trim();
    if (!accessCode) throw new BadRequestException('Access code is required to spin the wheel.');

    const entry = await this.prisma.customerRaffleEntry.findUnique({ where: { accessCode } });
    if (!entry) throw new NotFoundException('Raffle entry not found. Please register first.');
    if (!entry.verified) throw new BadRequestException('Please verify your access code before spinning.');

    const now     = new Date();
    const sameDay = this.isSameDay(entry.lastSpinAt, now);
    const spinsToday = sameDay ? entry.dailySpinCount : 0;

    if (spinsToday >= DAILY_SPIN_LIMIT) {
      return {
        eligibleToSpin: false,
        remainingSpins: 0,
        message: 'You have used all 3 spins for today. Come back tomorrow.',
        nextEligibleAt: this.getNextDayStart(now).toISOString(),
      };
    }

    const reward = this.pickReward();
    const spin   = await this.prisma.customerRaffleSpin.create({
      data: { raffleEntryId: entry.id, rewardType: reward.type as any, rewardLabel: reward.label },
    });

    const updated = await this.prisma.customerRaffleEntry.update({
      where: { id: entry.id },
      data: {
        lastSpinAt:     now,
        spinCount:      { increment: 1 },
        dailySpinCount: sameDay ? { increment: 1 } : 1,
      },
    });

    const remainingSpins = Math.max(0, DAILY_SPIN_LIMIT - updated.dailySpinCount);
    return {
      eligibleToSpin: remainingSpins > 0,
      remainingSpins,
      message: `Congratulations! ${reward.label}`,
      reward: {
        type:      reward.type,
        label:     reward.label,
        description: reward.description,
        expiresAt: this.getRewardExpiry(now).toISOString(),
      },
      spinId:         spin.id,
      nextEligibleAt: this.getNextDayStart(now).toISOString(),
    };
  }

  // ─── Weighted random algorithm ─────────────────────────────────────────────
  private pickReward(): RaffleReward {
    // Roll an integer in [0, TOTAL_WEIGHT-1]. Each reward occupies exactly
    // `weight` integers in [0, 99], so probabilities are exact.
    const roll = Math.floor(Math.random() * TOTAL_WEIGHT);
    let cumulative = 0;
    for (const reward of REWARDS) {
      cumulative += reward.weight;
      if (roll < cumulative) return reward;
    }
    return REWARDS[REWARDS.length - 1];
  }

  // ─── SMS helper ────────────────────────────────────────────────────────────
  private async sendSms(phone: string, text: string): Promise<void> {
    const apiKey   = this.config.get<string>('ARKESEL_API_KEY');
    const senderId = this.config.get<string>('ARKESEL_SENDER_ID') ?? 'Crave&Co';

    if (!apiKey || apiKey === 'your_arkesel_api_key_here') {
      console.warn(`[SMS DEV] To: ${phone} | Msg: ${text}`);
      return;
    }

    const to = (() => {
      const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '');
      if (cleaned.startsWith('0'))   return '233' + cleaned.slice(1);
      if (cleaned.startsWith('233')) return cleaned;
      return cleaned;
    })();

    const url = new URL('https://sms.arkesel.com/sms/api');
    url.searchParams.set('action',  'send-sms');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('to',      to);
    url.searchParams.set('from',    senderId);
    url.searchParams.set('sms',     text.trim());

    let raw: string;
    try {
      raw = await (await fetch(url.toString())).text();
    } catch {
      throw new InternalServerErrorException('Could not reach SMS gateway.');
    }

    let data: { code: string; message?: string };
    try { data = JSON.parse(raw) as typeof data; }
    catch { throw new InternalServerErrorException(`Unexpected SMS response: ${raw.slice(0, 80)}`); }

    if (data.code !== 'ok') {
      throw new InternalServerErrorException(data.message ?? `SMS error (code: ${data.code})`);
    }
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────
  private buildSession(
    accessCode: string,
    phone: string,
    remainingSpins: number,
    message = 'Welcome back! Ready to spin.',
  ) {
    return { accessCode, phone, remainingSpins, eligibleToSpin: remainingSpins > 0, message };
  }

  private generateAccessCode(): string {
    const alpha = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }).map(() => alpha[Math.floor(Math.random() * alpha.length)]).join('');
  }

  private todayUtc(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private isSameDay(a: Date | null | undefined, b: Date): boolean {
    if (!a) return false;
    return a.getUTCFullYear() === b.getUTCFullYear()
        && a.getUTCMonth()    === b.getUTCMonth()
        && a.getUTCDate()     === b.getUTCDate();
  }

  private getNextDayStart(ref: Date): Date {
    const d = new Date(ref);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + 1);
    return d;
  }

  private getRewardExpiry(ref: Date): Date {
    const d = new Date(ref);
    d.setHours(d.getHours() + REWARD_EXPIRY_HOURS);
    return d;
  }
}
