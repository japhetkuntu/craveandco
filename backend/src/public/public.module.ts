import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { MenuModule } from '../menu/menu.module';
import { OrdersModule } from '../orders/orders.module';
import { CustomersModule } from '../customers/customers.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { PublicMenuController } from './public-menu.controller';
import { PublicCustomerOrdersController } from './public-customer-orders.controller';
import { PublicWebhookController } from './public-webhook.controller';
import { PublicRaffleController } from './public-raffle.controller';
import { PublicRaffleService } from './public-raffle.service';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    MenuModule,
    OrdersModule,
    CustomerAuthModule,
    CustomersModule,
  ],
  providers: [PublicRaffleService],
  controllers: [
    PublicMenuController,
    PublicCustomerOrdersController,
    PublicWebhookController,
    PublicRaffleController,
  ],
})
export class PublicModule {}
