import { Body, Controller, Get, Param, Post, Query, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerJwtAuthGuard } from '../customer-auth/guards/customer-jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { OrderChannel, PaymentMethod } from '@prisma/client';
import { CreateOrderDto, PayOrderDto } from '../orders/dto/orders.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

class InitializePaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  paymentLabel?: string;
}

@Controller('api/v1/public/customer/orders')
export class PublicCustomerOrdersController {
  constructor(
    private orders: OrdersService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async resolveBranchId(branchId?: string) {
    if (branchId) return branchId;
    const envBranchId = this.config.get<string>('DEFAULT_BRANCH_ID');
    if (envBranchId) return envBranchId;
    const branch = await this.prisma.branch.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } });
    if (!branch) {
      throw new NotFoundException('No active branch configured');
    }
    return branch.id;
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Get()
  async findAll(
    @CurrentUser('customerId') customerId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '20',
  ) {
    const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    return this.orders.findByCustomerId(customerId, pageNumber, limitNumber);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Get(':id')
  async findOne(
    @CurrentUser('customerId') customerId: string,
    @Param('id') id: string,
  ) {
    return this.orders.findOneByCustomerId(customerId, id);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Post()
  async create(
    @CurrentUser('customerId') customerId: string,
    @Body() dto: CreateOrderDto,
  ) {
    dto.customerId = customerId;
    dto.branchId = await this.resolveBranchId(dto.branchId);
    dto.channel = dto.channel || OrderChannel.TAKEAWAY;
    return this.orders.create(dto);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Post(':id/pay')
  async initializePayment(
    @CurrentUser('customerId') customerId: string,
    @Param('id') id: string,
    @Body() dto: InitializePaymentDto,
  ) {
    const order = await this.orders.findOneByCustomerId(customerId, id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentStatus === 'SUCCESS') {
      throw new BadRequestException('Order is already paid');
    }
    const paystackKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!paystackKey) {
      throw new BadRequestException('Paystack is not configured');
    }

    const callbackBase = this.config.get<string>('PAYSTACK_CALLBACK_URL') || '';
    const callbackUrl = callbackBase ? `${callbackBase.replace(/\/$/, '')}/${order.id}` : undefined;

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: order.customer?.email,
        amount: Math.round(Number(order.total) * 100),
        callback_url: callbackUrl,
        metadata: {
          orderId: order.id,
          customerId,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new BadRequestException(data.message || 'Unable to initialize payment');
    }

    await this.orders.updatePaymentReference(
      order.id,
      data.data.reference,
      'PENDING',
      data.data.authorization_url,
      dto.paymentMethod,
      dto.paymentLabel,
    );

    return {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Post(':id/verify')
  async verifyPayment(
    @CurrentUser('customerId') customerId: string,
    @Param('id') id: string,
  ) {
    const order = await this.orders.findOneByCustomerId(customerId, id);
    if (!order || !order.paymentReference) {
      throw new BadRequestException('Cannot verify payment for this order');
    }

    const paystackKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!paystackKey) {
      throw new BadRequestException('Paystack is not configured');
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${order.paymentReference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
      },
    });
    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new BadRequestException(data.message || 'Unable to verify payment');
    }

    if (data.data.status === 'success' && !order.paidAt) {
      await this.orders.pay(order.id, {
        paymentMethod: order.paymentMethod ?? PaymentMethod.CARD,
        paymentLabel: order.paymentLabel || 'Paystack',
        receiptUrl: data.data.authorization_url ?? order.receiptUrl,
      } as PayOrderDto);
    }

    return this.orders.findOneByCustomerId(customerId, id);
  }
}
