"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const orders_module_1 = require("./orders/orders.module");
const menu_module_1 = require("./menu/menu.module");
const recipes_module_1 = require("./recipes/recipes.module");
const inventory_module_1 = require("./inventory/inventory.module");
const kitchen_module_1 = require("./kitchen/kitchen.module");
const purchasing_module_1 = require("./purchasing/purchasing.module");
const staff_module_1 = require("./staff/staff.module");
const finance_module_1 = require("./finance/finance.module");
const customers_module_1 = require("./customers/customers.module");
const loyalty_module_1 = require("./loyalty/loyalty.module");
const campaigns_module_1 = require("./campaigns/campaigns.module");
const feedback_module_1 = require("./feedback/feedback.module");
const reports_module_1 = require("./reports/reports.module");
const alerts_module_1 = require("./alerts/alerts.module");
const owner_module_1 = require("./owner/owner.module");
const ops_module_1 = require("./ops/ops.module");
const growth_module_1 = require("./growth/growth.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            orders_module_1.OrdersModule,
            menu_module_1.MenuModule,
            recipes_module_1.RecipesModule,
            inventory_module_1.InventoryModule,
            kitchen_module_1.KitchenModule,
            purchasing_module_1.PurchasingModule,
            staff_module_1.StaffModule,
            finance_module_1.FinanceModule,
            customers_module_1.CustomersModule,
            loyalty_module_1.LoyaltyModule,
            campaigns_module_1.CampaignsModule,
            feedback_module_1.FeedbackModule,
            reports_module_1.ReportsModule,
            alerts_module_1.AlertsModule,
            owner_module_1.OwnerModule,
            ops_module_1.OpsModule,
            growth_module_1.GrowthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map