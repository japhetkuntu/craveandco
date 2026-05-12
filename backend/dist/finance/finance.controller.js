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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const pagination_1 = require("../common/pagination");
const finance_service_1 = require("./finance.service");
const finance_dto_1 = require("./dto/finance.dto");
let FinanceController = class FinanceController {
    finance;
    constructor(finance) {
        this.finance = finance;
    }
    createExpense(userId, branchId, dto) {
        return this.finance.createExpense(userId, branchId, dto);
    }
    findExpenses(branchId, from, to, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.finance.findExpenses(branchId, from, to, pageNumber, limitNumber);
    }
    approveExpense(id, dto) {
        return this.finance.approveExpense(id, dto.approved);
    }
    reconcileCash(userId, dto) {
        return this.finance.reconcileCash(dto, userId);
    }
    getDailySummary(branchId, date) {
        return this.finance.getDailySummary(branchId, date);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Post)('expenses'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, finance_dto_1.CreateExpenseDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createExpense", null);
__decorate([
    (0, common_1.Get)('expenses'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "findExpenses", null);
__decorate([
    (0, common_1.Patch)('expenses/:id/approve'),
    (0, roles_decorator_1.Roles)('OWNER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.ApproveExpenseDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "approveExpense", null);
__decorate([
    (0, common_1.Post)('cash/reconcile'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.ReconcileCashDto]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "reconcileCash", null);
__decorate([
    (0, common_1.Get)('finance/daily-summary'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('branchId')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "getDailySummary", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.Controller)('api/v1'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map