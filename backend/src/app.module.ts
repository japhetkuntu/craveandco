import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { PublicModule } from './public/public.module';
import { FilesModule } from './files/files.module';
import { OrdersModule } from './orders/orders.module';
import { MenuModule } from './menu/menu.module';
import { RecipesModule } from './recipes/recipes.module';
import { InventoryModule } from './inventory/inventory.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { PurchasingModule } from './purchasing/purchasing.module';
import { StaffModule } from './staff/staff.module';
import { FinanceModule } from './finance/finance.module';
import { CustomersModule } from './customers/customers.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ReportsModule } from './reports/reports.module';
import { AlertsModule } from './alerts/alerts.module';
import { OwnerModule } from './owner/owner.module';
import { OpsModule } from './ops/ops.module';
import { GrowthModule } from './growth/growth.module';
import { PromotionsModule } from './promotions/promotions.module';
import { SpecialOrdersModule } from './special-orders/special-orders.module';
import { EngagementModule } from './engagement/engagement.module';
import { SalesModule } from './sales/sales.module';
import { RaffleAdminModule } from './raffle-admin/raffle-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CustomerAuthModule,
    PublicModule,
    FilesModule,
    OrdersModule,
    MenuModule,
    RecipesModule,
    InventoryModule,
    KitchenModule,
    PurchasingModule,
    StaffModule,
    FinanceModule,
    CustomersModule,
    LoyaltyModule,
    CampaignsModule,
    FeedbackModule,
    ReportsModule,
    AlertsModule,
    OwnerModule,
    OpsModule,
    GrowthModule,
    PromotionsModule,
    SpecialOrdersModule,
    EngagementModule,
    SalesModule,
    RaffleAdminModule,
  ],
})
export class AppModule {}
