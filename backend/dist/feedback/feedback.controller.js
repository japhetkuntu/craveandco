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
exports.FeedbackController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const pagination_1 = require("../common/pagination");
const feedback_service_1 = require("./feedback.service");
const feedback_dto_1 = require("./dto/feedback.dto");
let FeedbackController = class FeedbackController {
    feedback;
    constructor(feedback) {
        this.feedback = feedback;
    }
    create(dto) {
        return this.feedback.create(dto);
    }
    getStats() {
        return this.feedback.getStats();
    }
    findAll(status, search, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.feedback.findAll(status, search, pageNumber, limitNumber);
    }
    resolve(id, dto) {
        return this.feedback.resolve(id, dto);
    }
};
exports.FeedbackController = FeedbackController;
__decorate([
    (0, common_1.Post)('tickets'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [feedback_dto_1.CreateFeedbackDto]),
    __metadata("design:returntype", void 0)
], FeedbackController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('tickets/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FeedbackController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('tickets'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], FeedbackController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('tickets/:id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, feedback_dto_1.ResolveFeedbackDto]),
    __metadata("design:returntype", void 0)
], FeedbackController.prototype, "resolve", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, common_1.Controller)('api/v1/feedback'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('OWNER', 'GROWTH_LEAD', 'OPERATIONS_MANAGER'),
    __metadata("design:paramtypes", [feedback_service_1.FeedbackService])
], FeedbackController);
//# sourceMappingURL=feedback.controller.js.map