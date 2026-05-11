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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const customers_service_1 = require("./customers.service");
const customers_dto_1 = require("./dto/customers.dto");
let CustomersController = class CustomersController {
    customers;
    constructor(customers) {
        this.customers = customers;
    }
    create(dto) {
        return this.customers.create(dto);
    }
    findAll(segment, search, lastSeenBefore, addedAfter, addedBefore, page = '0', limit = '50') {
        const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
        const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
        return this.customers.findAll({
            segment,
            search,
            lastSeenBefore,
            addedAfter,
            addedBefore,
            page: pageNumber,
            limit: limitNumber,
        });
    }
    getUpcomingBirthdays(days = '7') {
        const daysNum = Math.min(Math.max(parseInt(days, 10) || 7, 1), 30);
        return this.customers.getUpcomingBirthdays(daysNum);
    }
    getDashboard() {
        return this.customers.getDashboard();
    }
    findById(id) {
        return this.customers.findById(id);
    }
    update(id, dto) {
        return this.customers.update(id, dto);
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customers_dto_1.CreateCustomerDto]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('segment')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('lastSeenBefore')),
    __param(3, (0, common_1.Query)('addedAfter')),
    __param(4, (0, common_1.Query)('addedBefore')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('upcoming-birthdays'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "getUpcomingBirthdays", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customers_dto_1.UpdateCustomerDto]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "update", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.Controller)('api/v1/customers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'GROWTH_LEAD', 'CASHIER'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map