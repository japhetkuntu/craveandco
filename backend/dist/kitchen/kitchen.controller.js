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
exports.KitchenController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const pagination_1 = require("../common/pagination");
const kitchen_service_1 = require("./kitchen.service");
const kitchen_dto_1 = require("./dto/kitchen.dto");
let KitchenController = class KitchenController {
    kitchen;
    constructor(kitchen) {
        this.kitchen = kitchen;
    }
    getLiveOrders(branchId, station, page = '0', limit = '50') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit, 50);
        return this.kitchen.getLiveOrders(branchId, station, pageNumber, limitNumber);
    }
    updateOrderStatus(orderId, dto) {
        return this.kitchen.updateOrderStatus(orderId, dto.status);
    }
    getPrepList(branchId, date, shift, page = '0', limit = '50') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit, 50);
        return this.kitchen.getPrepList(branchId, date, shift, pageNumber, limitNumber);
    }
    createShortageRequest(branchId, dto) {
        return this.kitchen.createShortageRequest(dto.ingredientId, branchId, dto.reason);
    }
    logWaste(branchId, dto) {
        return this.kitchen.logWaste(dto.ingredientId, branchId, dto.quantity, dto.reason);
    }
    getWasteLogs(branchId, page = '0', limit = '50') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit, 50);
        return this.kitchen.getWasteLogs(branchId, pageNumber, limitNumber);
    }
    getHandoverNotes(date, shift, page = '0', limit = '50') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit, 50);
        return this.kitchen.getHandoverNotes(date, shift, pageNumber, limitNumber);
    }
    createHandoverNote(userId, dto) {
        return this.kitchen.createHandoverNote(userId, dto);
    }
    getStationLoad(branchId, page = '0', limit = '50') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit, 50);
        return this.kitchen.getStationLoad(branchId, pageNumber, limitNumber);
    }
};
exports.KitchenController = KitchenController;
__decorate([
    (0, common_1.Get)('orders/live'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('station')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "getLiveOrders", null);
__decorate([
    (0, common_1.Patch)('orders/:orderId/status'),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, kitchen_dto_1.UpdateKitchenOrderDto]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Get)('prep-list'),
    (0, roles_decorator_1.Roles)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('shift')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "getPrepList", null);
__decorate([
    (0, common_1.Post)('shortage-requests'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, kitchen_dto_1.CreateShortageRequestDto]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "createShortageRequest", null);
__decorate([
    (0, common_1.Post)('waste-logs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, kitchen_dto_1.CreateWasteLogDto]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "logWaste", null);
__decorate([
    (0, common_1.Get)('waste-logs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "getWasteLogs", null);
__decorate([
    (0, common_1.Get)('handover-notes'),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('shift')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "getHandoverNotes", null);
__decorate([
    (0, common_1.Post)('handover-notes'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, kitchen_dto_1.CreateHandoverNoteDto]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "createHandoverNote", null);
__decorate([
    (0, common_1.Get)('station-load'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], KitchenController.prototype, "getStationLoad", null);
exports.KitchenController = KitchenController = __decorate([
    (0, common_1.Controller)('api/v1/kitchen'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('KITCHEN_STAFF', 'OPERATIONS_MANAGER', 'OWNER'),
    __metadata("design:paramtypes", [kitchen_service_1.KitchenService])
], KitchenController);
//# sourceMappingURL=kitchen.controller.js.map