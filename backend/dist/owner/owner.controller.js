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
exports.OwnerController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const pagination_1 = require("../common/pagination");
const owner_service_1 = require("./owner.service");
const staff_dto_1 = require("./dto/staff.dto");
const payment_type_dto_1 = require("./dto/payment-type.dto");
let OwnerController = class OwnerController {
    owner;
    constructor(owner) {
        this.owner = owner;
    }
    getDashboard(branchId, from, to, date, rawCategoryIds) {
        const categoryIds = rawCategoryIds
            ? (Array.isArray(rawCategoryIds) ? rawCategoryIds : [rawCategoryIds]).filter(Boolean)
            : undefined;
        return this.owner.getDashboard(branchId, from, to, date, categoryIds?.length ? categoryIds : undefined);
    }
    getPendingApprovals(branchId, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.owner.getPendingApprovals(branchId, pageNumber, limitNumber);
    }
    approve(id) {
        return this.owner.approveItem(id, true);
    }
    reject(id) {
        return this.owner.approveItem(id, false);
    }
    getAlerts(branchId, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.owner.getOpenAlerts(branchId, pageNumber, limitNumber);
    }
    listStaff(branchId, showInactive = 'false', page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        const includeInactive = showInactive === 'true';
        return this.owner.listStaff(branchId, pageNumber, limitNumber, includeInactive);
    }
    createStaff(branchId, dto) {
        return this.owner.createStaff(branchId, dto);
    }
    updateStaff(id, branchId, dto) {
        return this.owner.updateStaff(id, branchId, dto);
    }
    deactivateStaff(id, branchId) {
        return this.owner.deactivateStaff(id, branchId);
    }
    listPaymentTypes(branchId, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.owner.listPaymentTypes(branchId, pageNumber, limitNumber);
    }
    createPaymentType(branchId, dto) {
        return this.owner.createPaymentType(branchId, dto);
    }
    updatePaymentType(id, dto) {
        return this.owner.updatePaymentType(id, dto);
    }
    deletePaymentType(id) {
        return this.owner.deletePaymentType(id);
    }
};
exports.OwnerController = OwnerController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('date')),
    __param(4, (0, common_1.Query)('categoryIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('approvals/pending'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Post)('approvals/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('approvals/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "reject", null);
__decorate([
    (0, common_1.Get)('alerts'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "getAlerts", null);
__decorate([
    (0, common_1.Get)('staff'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('showInactive')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "listStaff", null);
__decorate([
    (0, common_1.Post)('staff'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "createStaff", null);
__decorate([
    (0, common_1.Patch)('staff/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, staff_dto_1.UpdateStaffDto]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "updateStaff", null);
__decorate([
    (0, common_1.Delete)('staff/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "deactivateStaff", null);
__decorate([
    (0, common_1.Get)('payment-types'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "listPaymentTypes", null);
__decorate([
    (0, common_1.Post)('payment-types'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_type_dto_1.CreatePaymentTypeDto]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "createPaymentType", null);
__decorate([
    (0, common_1.Patch)('payment-types/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, payment_type_dto_1.UpdatePaymentTypeDto]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "updatePaymentType", null);
__decorate([
    (0, common_1.Delete)('payment-types/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OwnerController.prototype, "deletePaymentType", null);
exports.OwnerController = OwnerController = __decorate([
    (0, common_1.Controller)('api/v1/owner'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('OWNER'),
    __metadata("design:paramtypes", [owner_service_1.OwnerService])
], OwnerController);
//# sourceMappingURL=owner.controller.js.map