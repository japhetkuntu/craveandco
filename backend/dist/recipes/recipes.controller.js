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
exports.RecipesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const pagination_1 = require("../common/pagination");
const recipes_service_1 = require("./recipes.service");
const recipes_dto_1 = require("./dto/recipes.dto");
let RecipesController = class RecipesController {
    recipes;
    constructor(recipes) {
        this.recipes = recipes;
    }
    getRecipeItems(itemId, page = '0', limit = '10') {
        const pageNumber = (0, pagination_1.normalizePage)(page);
        const limitNumber = (0, pagination_1.normalizeLimit)(limit);
        return this.recipes.getRecipeItems(itemId, pageNumber, limitNumber);
    }
    createRecipeItem(itemId, dto) {
        return this.recipes.createRecipeItem(itemId, dto);
    }
    getRecipeImportSources(itemId) {
        return this.recipes.getRecipeImportSources(itemId);
    }
    importRecipeItems(itemId, dto) {
        return this.recipes.importRecipeItems(itemId, dto.sourceMenuItemId);
    }
    updateRecipeItem(itemId, id, dto) {
        return this.recipes.updateRecipeItem(itemId, id, dto);
    }
    deleteRecipeItem(itemId, id) {
        return this.recipes.deleteRecipeItem(itemId, id);
    }
};
exports.RecipesController = RecipesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "getRecipeItems", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recipes_dto_1.CreateRecipeItemDto]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "createRecipeItem", null);
__decorate([
    (0, common_1.Get)('import-sources'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "getRecipeImportSources", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, recipes_dto_1.ImportRecipeItemsDto]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "importRecipeItems", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, recipes_dto_1.UpdateRecipeItemDto]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "updateRecipeItem", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('OWNER', 'OPERATIONS_MANAGER'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], RecipesController.prototype, "deleteRecipeItem", null);
exports.RecipesController = RecipesController = __decorate([
    (0, common_1.Controller)('api/v1/menu/items/:itemId/recipe-items'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [recipes_service_1.RecipesService])
], RecipesController);
//# sourceMappingURL=recipes.controller.js.map