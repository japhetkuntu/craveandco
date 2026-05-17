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
exports.PurchasingController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const pagination_1 = require("../common/pagination");
const purchasing_service_1 = require("./purchasing.service");
const purchasing_dto_1 = require("./dto/purchasing.dto");
const client_1 = require("@prisma/client");
let PurchasingController = class PurchasingController {
    purchasing;
    constructor(purchasing) {
        this.purchasing = purchasing;
    }
    createSupplier(dto) {
        return this.purchasing.createSupplier(dto);
    }
    findSuppliers(page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.purchasing.findSuppliers(pageNumber, limitNumber);
    }
    createPurchaseOrder(userId, role, dto) {
        return this.purchasing.createPurchaseOrder(dto, userId, role);
    }
    approvePurchaseOrder(userId, id) {
        return this.purchasing.approvePurchaseOrder(id, userId);
    }
    cancelPurchaseOrder(id) {
        return this.purchasing.cancelPurchaseOrder(id);
    }
    findPurchaseOrders(branchId, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.purchasing.findPurchaseOrders(branchId, pageNumber, limitNumber);
    }
};
exports.PurchasingController = PurchasingController;
__decorate([
    (0, common_1.Post)('suppliers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [purchasing_dto_1.CreateSupplierDto]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "createSupplier", null);
__decorate([
    (0, common_1.Get)('suppliers'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findSuppliers", null);
__decorate([
    (0, common_1.Post)('purchase-orders'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, purchasing_dto_1.CreatePurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "createPurchaseOrder", null);
__decorate([
    (0, common_1.Post)('purchase-orders/:id/approve'),
    (0, roles_decorator_1.Roles)('OWNER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "approvePurchaseOrder", null);
__decorate([
    (0, common_1.Post)('purchase-orders/:id/cancel'),
    (0, roles_decorator_1.Roles)('OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "cancelPurchaseOrder", null);
__decorate([
    (0, common_1.Get)('purchase-orders'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], PurchasingController.prototype, "findPurchaseOrders", null);
exports.PurchasingController = PurchasingController = __decorate([
    (0, common_1.Controller)('api/v1'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __metadata("design:paramtypes", [purchasing_service_1.PurchasingService])
], PurchasingController);
//# sourceMappingURL=purchasing.controller.js.map