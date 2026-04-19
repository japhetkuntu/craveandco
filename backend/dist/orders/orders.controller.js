"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const orders_service_1 = require("./orders.service");
const orders_dto_1 = require("./dto/orders.dto");
let OrdersController = class OrdersController {
    orders;
    constructor(orders) {
        this.orders = orders;
    }
    create(dto) {
        return this.orders.create(dto);
    }
    findLive(branchId, page = '0', limit = '50') {
        const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        return this.orders.findLive(branchId, pageNumber, limitNumber);
    }
    findOne(id) {
        return this.orders.findOne(id);
    }
    updateStatus(id, dto) {
        return this.orders.updateStatus(id, dto);
    }
    updateItems(id, dto) {
        return this.orders.updateItems(id, dto);
    }
    addItem(id, dto) {
        return this.orders.addItem(id, dto);
    }
    removeItem(id, itemId) {
        return this.orders.removeItem(id, itemId);
    }
    pay(id, dto) {
        return this.orders.pay(id, dto);
    }
    findAll(branchId, status, channel, paymentMethod, from, to, search, page = '0', limit = '50') {
        const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        return this.orders.findAll(branchId, { status, channel, paymentMethod, from, to, search }, pageNumber, limitNumber);
    }
    cancel(id) {
        return this.orders.cancel(id);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [orders_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF', 'GROWTH_LEAD'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findLive", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD', 'KITCHEN_STAFF'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF', 'GROWTH_LEAD'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, orders_dto_1.UpdateOrderStatusDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/items'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, orders_dto_1.UpdateOrderItemsDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateItems", null);
__decorate([
    (0, common_1.Post)(':id/items'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, orders_dto_1.AddOrderItemDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "addItem", null);
__decorate([
    (0, common_1.Delete)(':id/items/:itemId'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Post)(':id/pay'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, orders_dto_1.PayOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "pay", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('channel')),
    __param(3, (0, common_1.Query)('paymentMethod')),
    __param(4, (0, common_1.Query)('from')),
    __param(5, (0, common_1.Query)('to')),
    __param(6, (0, common_1.Query)('search')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "cancel", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('api/v1/orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map