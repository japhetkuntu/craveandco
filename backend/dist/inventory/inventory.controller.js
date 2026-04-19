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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const pagination_1 = require("../common/pagination");
const inventory_service_1 = require("./inventory.service");
const inventory_dto_1 = require("./dto/inventory.dto");
let InventoryController = class InventoryController {
    inventory;
    constructor(inventory) {
        this.inventory = inventory;
    }
    getIngredients(page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.inventory.getIngredients(pageNumber, limitNumber);
    }
    createIngredient(dto) {
        return this.inventory.createIngredient(dto);
    }
    updateIngredient(id, dto) {
        return this.inventory.updateIngredient(id, dto);
    }
    getStock(branchId, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.inventory.getStock(branchId, pageNumber, limitNumber);
    }
    createMovement(dto) {
        return this.inventory.createMovement(dto);
    }
    getMovements(branchId, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.inventory.getMovements(branchId, pageNumber, limitNumber);
    }
    getMovementAnalytics(branchId) {
        return this.inventory.getMovementAnalytics(branchId);
    }
    getLowStock(branchId, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.inventory.getLowStock(branchId, pageNumber, limitNumber);
    }
    createStockCount(dto) {
        return this.inventory.createStockCount(dto);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('ingredients'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getIngredients", null);
__decorate([
    (0, common_1.Post)('ingredients'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateIngredientDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createIngredient", null);
__decorate([
    (0, common_1.Patch)('ingredients/:id'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateIngredientDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "updateIngredient", null);
__decorate([
    (0, common_1.Get)('stock'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStock", null);
__decorate([
    (0, common_1.Post)('movements'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateMovementDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createMovement", null);
__decorate([
    (0, common_1.Get)('movements'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getMovements", null);
__decorate([
    (0, common_1.Get)('movements/analytics'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getMovementAnalytics", null);
__decorate([
    (0, common_1.Get)('alerts/low-stock'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getLowStock", null);
__decorate([
    (0, common_1.Post)('stock-counts'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateStockCountDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createStockCount", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('api/v1/inventory'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map