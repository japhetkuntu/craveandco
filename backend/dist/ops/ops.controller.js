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
exports.OpsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const pagination_1 = require("../common/pagination");
const ops_service_1 = require("./ops.service");
let OpsController = class OpsController {
    ops;
    constructor(ops) {
        this.ops = ops;
    }
    getCommandCenter(branchId, from, to, date) {
        return this.ops.getCommandCenter(branchId, from, to, date);
    }
    getServiceTimeline(branchId, from, to, date, page = '0', limit = '50') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit, 50);
        return this.ops.getServiceTimeline(branchId, from, to, date, pageNumber, limitNumber);
    }
    dayClose(branchId, userId, body) {
        return this.ops.dayClose(branchId, userId, Number(body?.openingFloat ?? 0), Number(body?.cashCounted ?? 0), body?.notes);
    }
    getDayCloseSummary(branchId, date) {
        return this.ops.getDayCloseSummary(branchId, date);
    }
    getChecklists(branchId, currentUserId, role, date) {
        const userId = role === 'OWNER' ? undefined : currentUserId;
        return this.ops.getChecklists(branchId, date, userId);
    }
    getChecklistHistory(branchId, currentUserId, role, from, to, userId, roleFilter) {
        const effectiveUserId = role === 'OWNER' || role === 'OPERATIONS_MANAGER' ? userId : currentUserId;
        return this.ops.getChecklistHistory(branchId, effectiveUserId, roleFilter, from, to);
    }
    saveChecklists(branchId, userId, body) {
        return this.ops.saveChecklists(branchId, userId, body.date, body.lists);
    }
};
exports.OpsController = OpsController;
__decorate([
    (0, common_1.Get)('command-center'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getCommandCenter", null);
__decorate([
    (0, common_1.Get)('service-timeline'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('date')),
    __param(4, (0, common_1.Query)('page')),
    __param(5, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getServiceTimeline", null);
__decorate([
    (0, common_1.Post)('day-close'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "dayClose", null);
__decorate([
    (0, common_1.Get)('day-close-summary'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getDayCloseSummary", null);
__decorate([
    (0, common_1.Get)('checklists'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF', 'GROWTH_LEAD'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getChecklists", null);
__decorate([
    (0, common_1.Get)('checklists/history'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF', 'GROWTH_LEAD'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(3, (0, common_1.Query)('from')),
    __param(4, (0, common_1.Query)('to')),
    __param(5, (0, common_1.Query)('userId')),
    __param(6, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getChecklistHistory", null);
__decorate([
    (0, common_1.Post)('checklists'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF', 'GROWTH_LEAD'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "saveChecklists", null);
exports.OpsController = OpsController = __decorate([
    (0, common_1.Controller)('api/v1/ops'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [ops_service_1.OpsService])
], OpsController);
//# sourceMappingURL=ops.controller.js.map