import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MenuModule } from '../menu/menu.module';
import { OrdersModule } from '../orders/orders.module';
import { CustomersModule } from '../customers/customers.module';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';
import { PublicMenuController } from './public-menu.controller';
import { PublicCustomerOrdersController } from './public-customer-orders.controller';
import { PublicWebhookController } from './public-webhook.controller';

@Module({
  imports: [ConfigModule, MenuModule, OrdersModule, CustomerAuthModule, CustomersModule],
  controllers: [PublicMenuController, PublicCustomerOrdersController, PublicWebhookController],
})
export class PublicModule {}
