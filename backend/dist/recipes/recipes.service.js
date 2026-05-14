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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RecipesService = class RecipesService {
    prisma;
    groupedComponentsOptionId = '__meta_grouped_menu_components';
    constructor(prisma) {
        this.prisma = prisma;
    }
    stripGroupedComponentsOption(options) {
        if (!Array.isArray(options))
            return [];
        return options.filter((option) => option && option.id !== this.groupedComponentsOptionId);
    }
    async clearGroupedComponentsOption(menuItemId) {
        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: menuItemId },
            select: { options: true },
        });
        if (!menuItem)
            return;
        const visibleOptions = this.stripGroupedComponentsOption(menuItem.options);
        const currentOptions = Array.isArray(menuItem.options) ? menuItem.options : [];
        if (visibleOptions.length === currentOptions.length)
            return;
        await this.prisma.menuItem.update({
            where: { id: menuItemId },
            data: { options: visibleOptions },
        });
    }
    async setGroupedComponentsOption(menuItemId, sourceMenuItems) {
        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: menuItemId },
            select: { options: true },
        });
        if (!menuItem)
            throw new common_1.NotFoundException('Target menu item not found');
        const visibleOptions = this.stripGroupedComponentsOption(menuItem.options);
        const groupedComponentsOption = {
            id: this.groupedComponentsOptionId,
            name: 'Grouped Menu Components',
            required: false,
            multiple: true,
            values: sourceMenuItems.map((item) => ({
                id: item.id,
                label: item.name,
                priceAdjustment: 0,
            })),
        };
        await this.prisma.menuItem.update({
            where: { id: menuItemId },
            data: { options: [...visibleOptions, groupedComponentsOption] },
        });
    }
    async resolveIngredient(ingredientId, ingredientName, unit, ingredientCost) {
        if (ingredientId) {
            const ingredient = await this.prisma.ingredient.findUnique({
                where: { id: ingredientId },
            });
            if (!ingredient)
                throw new common_1.NotFoundException('Ingredient not found');
            if (ingredientCost !== undefined &&
                ingredientCost !== Number(ingredient.currentCost)) {
                return this.prisma.ingredient.update({
                    where: { id: ingredientId },
                    data: { currentCost: ingredientCost },
                });
            }
            return ingredient;
        }
        const name = ingredientName?.trim();
        if (!name) {
            throw new common_1.BadRequestException('Ingredient id or name is required');
        }
        let ingredient = await this.prisma.ingredient.findFirst({
            where: { name },
        });
        if (!ingredient) {
            ingredient = await this.prisma.ingredient.create({
                data: {
                    name,
                    unit: unit ?? 'unit',
                    currentCost: ingredientCost ?? 0,
                    reorderLevel: 0,
                },
            });
        }
        else if (ingredientCost !== undefined &&
            ingredientCost !== Number(ingredient.currentCost)) {
            ingredient = await this.prisma.ingredient.update({
                where: { id: ingredient.id },
                data: { currentCost: ingredientCost },
            });
        }
        return ingredient;
    }
    async getRecipeItems(menuItemId, page = 0, limit = 10) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        const recipeItems = await this.prisma.recipeItem.findMany({
            where: { menuItemId },
            include: { ingredient: true },
            orderBy: { id: 'asc' },
            take,
            skip,
        });
        return recipeItems;
    }
    async createRecipeItem(menuItemId, dto) {
        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: menuItemId },
        });
        await this.clearGroupedComponentsOption(menuItemId);
        if (!menuItem)
            throw new common_1.NotFoundException('Menu item not found');
        const ingredient = await this.resolveIngredient(dto.ingredientId, dto.ingredientName, dto.unit, dto.unitCost);
        const ingredientId = ingredient.id;
        const existingRecipeItem = await this.prisma.recipeItem.findUnique({
            where: {
                menuItemId_ingredientId: {
                    menuItemId,
                    ingredientId,
                },
            },
        });
        if (existingRecipeItem) {
            throw new common_1.BadRequestException('Ingredient already exists in this recipe');
        }
        return this.prisma.recipeItem.create({
            data: {
                menuItemId,
                ingredientId,
                quantity: dto.quantity,
                unit: dto.unit ?? ingredient.unit,
            },
            include: { ingredient: true },
        });
    }
    async updateRecipeItem(menuItemId, recipeItemId, dto) {
        const recipeItem = await this.prisma.recipeItem.findUnique({
            where: { id: recipeItemId },
            include: { ingredient: true },
        });
        if (!recipeItem || recipeItem.menuItemId !== menuItemId) {
            throw new common_1.NotFoundException('Recipe item not found');
        }
        const data = {};
        let ingredient = recipeItem.ingredient;
        if ((dto.ingredientId || dto.ingredientName) &&
            (dto.ingredientId !== recipeItem.ingredientId ||
                dto.ingredientName?.trim() !== recipeItem.ingredient.name)) {
            ingredient = await this.resolveIngredient(dto.ingredientId, dto.ingredientName, dto.unit, dto.unitCost);
            if (ingredient.id !== recipeItem.ingredientId) {
                const duplicate = await this.prisma.recipeItem.findUnique({
                    where: {
                        menuItemId_ingredientId: {
                            menuItemId,
                            ingredientId: ingredient.id,
                        },
                    },
                });
                if (duplicate) {
                    throw new common_1.BadRequestException('Ingredient already exists in this recipe');
                }
            }
            data.ingredientId = ingredient.id;
            if (dto.unit === undefined) {
                data.unit = ingredient.unit;
            }
        }
        else if (dto.unitCost !== undefined) {
            ingredient = await this.resolveIngredient(recipeItem.ingredientId, undefined, undefined, dto.unitCost);
            data.ingredientId = recipeItem.ingredientId;
        }
        if (dto.quantity !== undefined) {
            data.quantity = dto.quantity;
        }
        if (dto.unit !== undefined) {
            data.unit = dto.unit;
        }
        return this.prisma.recipeItem.update({
            where: { id: recipeItemId },
            data,
            include: { ingredient: true },
        });
    }
    async deleteRecipeItem(menuItemId, recipeItemId) {
        const recipeItem = await this.prisma.recipeItem.findUnique({
            where: { id: recipeItemId },
        });
        if (!recipeItem || recipeItem.menuItemId !== menuItemId) {
            throw new common_1.NotFoundException('Recipe item not found');
        }
        return this.prisma.recipeItem.delete({ where: { id: recipeItemId } });
    }
    async getRecipeImportSources(menuItemId) {
        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: menuItemId },
            select: { branchId: true },
        });
        if (!menuItem) {
            throw new common_1.NotFoundException('Menu item not found');
        }
        return this.prisma.menuItem.findMany({
            where: {
                id: { not: menuItemId },
                branchId: menuItem.branchId,
            },
            select: {
                id: true,
                name: true,
                price: true,
                category: { select: { id: true, name: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async importRecipeItems(menuItemId, sourceMenuItemIds, importMode = 'SNAPSHOT') {
        const uniqueSourceIds = Array.from(new Set(sourceMenuItemIds.map((id) => id.trim()).filter(Boolean)));
        if (uniqueSourceIds.length === 0) {
            throw new common_1.BadRequestException('At least one source menu item is required');
        }
        if (uniqueSourceIds.includes(menuItemId)) {
            throw new common_1.BadRequestException('Source and target menu items must be different');
        }
        const targetMenuItem = await this.prisma.menuItem.findUnique({
            where: { id: menuItemId },
            include: { recipeItems: true },
        });
        if (!targetMenuItem) {
            throw new common_1.NotFoundException('Target menu item not found');
        }
        if (importMode === 'SNAPSHOT' && targetMenuItem.recipeItems.length > 0) {
            throw new common_1.BadRequestException('Target menu item already has cost items');
        }
        const sourceMenuItems = await this.prisma.menuItem.findMany({
            where: {
                id: { in: uniqueSourceIds },
                branchId: targetMenuItem.branchId,
            },
            include: { recipeItems: true },
        });
        if (sourceMenuItems.length !== uniqueSourceIds.length) {
            throw new common_1.NotFoundException('One or more source menu items were not found');
        }
        if (importMode === 'GROUPED') {
            await this.prisma.recipeItem.deleteMany({ where: { menuItemId } });
            await this.setGroupedComponentsOption(menuItemId, sourceMenuItems.map((item) => ({ id: item.id, name: item.name })));
            return this.getRecipeItems(menuItemId);
        }
        const sourceRecipeItems = sourceMenuItems.flatMap((item) => item.recipeItems);
        if (sourceRecipeItems.length === 0) {
            throw new common_1.BadRequestException('Selected source menu items do not have any cost items to import');
        }
        const mergedRecipeItems = new Map();
        sourceRecipeItems.forEach((recipeItem) => {
            const existing = mergedRecipeItems.get(recipeItem.ingredientId);
            if (existing) {
                existing.quantity += Number(recipeItem.quantity);
                return;
            }
            mergedRecipeItems.set(recipeItem.ingredientId, {
                ingredientId: recipeItem.ingredientId,
                quantity: Number(recipeItem.quantity),
                unit: recipeItem.unit,
            });
        });
        await this.clearGroupedComponentsOption(menuItemId);
        await this.prisma.recipeItem.createMany({
            data: Array.from(mergedRecipeItems.values()).map((recipeItem) => ({
                menuItemId,
                ingredientId: recipeItem.ingredientId,
                quantity: recipeItem.quantity,
                unit: recipeItem.unit,
            })),
        });
        return this.getRecipeItems(menuItemId);
    }
};
exports.RecipesService = RecipesService;
exports.RecipesService = RecipesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecipesService);
//# sourceMappingURL=recipes.service.js.map