import { Controller, Post, Req, Res, HttpCode, Logger } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@prisma/client';
import { OrdersService } from '../orders/orders.service';
import { PayOrderDto } from '../orders/dto/orders.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/public/webhooks')
export class PublicWebhookController {
  private readonly logger = new Logger(PublicWebhookController.name);

  constructor(
    private readonly orders: OrdersService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /api/v1/public/webhooks/paystack
   *
   * Paystack webhook URL — add this to your Paystack dashboard under:
   *   Settings → API Keys & Webhooks → Webhook URL
   *
   * For production: https://your-domain.com/api/v1/public/webhooks/paystack
   * For local dev:  use ngrok or similar to expose localhost:5001
   */
  @Post('paystack')
  @HttpCode(200)
  async handlePaystack(
    @Req() req: any,
    @Res() res: any,
  ) {
    const secret = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      this.logger.warn('PAYSTACK_SECRET_KEY not configured — webhook ignored');
      return res.status(200).json({ received: true });
    }

    const signature = req.headers['x-paystack-signature'] as string | undefined;
    const rawBody = req.rawBody;

    if (!signature || !rawBody) {
      return res.status(401).json({ message: 'Missing signature or body' });
    }

    const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
    if (expected !== signature) {
      this.logger.warn('Paystack webhook signature mismatch — rejecting');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    let event: { event: string; data: Record<string, any> };
    try {
      event = JSON.parse(rawBody.toString());
    } catch {
      return res.status(200).json({ received: true });
    }

    this.logger.log(`Paystack webhook event: ${event.event}`);

    if (event.event === 'charge.success') {
      await this.handleChargeSuccess(event.data);
    }

    return res.status(200).json({ received: true });
  }

  private async handleChargeSuccess(data: Record<string, any>) {
    const reference: string | undefined = data?.reference;
    const orderId: string | undefined = data?.metadata?.orderId;

    if (!orderId || !reference) {
      this.logger.warn('charge.success missing orderId or reference in metadata');
      return;
    }

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        this.logger.warn(`Webhook: order ${orderId} not found`);
        return;
      }

      if (order.paidAt) {
        this.logger.log(`Webhook: order ${orderId} already paid — skipping`);
        return;
      }

      if (order.paymentReference && order.paymentReference !== reference) {
        this.logger.warn(
          `Webhook: reference mismatch for order ${orderId} (expected ${order.paymentReference}, got ${reference})`,
        );
        return;
      }

      await this.orders.pay(order.id, {
        paymentMethod: order.paymentMethod ?? PaymentMethod.CARD,
        paymentLabel: order.paymentLabel || 'Paystack',
        receiptUrl: data?.authorization?.authorization_url ?? order.receiptUrl ?? undefined,
      } as PayOrderDto);

      this.logger.log(`✅ Order ${orderId} fulfilled via Paystack webhook (ref: ${reference})`);
    } catch (err) {
      this.logger.error(`Webhook: error fulfilling order ${orderId}`, err);
    }
  }
}
