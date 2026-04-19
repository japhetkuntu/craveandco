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
exports.MenuService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MenuService = class MenuService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCategory(dto) {
        return this.prisma.menuCategory.create({ data: dto });
    }
    async findCategories(page = 0, limit = 50) {
        const take = Math.min(Math.max(limit, 10), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.menuCategory.findMany({
            where: { active: true },
            orderBy: { sortOrder: 'asc' },
            include: { items: true },
            take,
            skip,
        });
    }
    async updateCategory(id, dto) {
        const category = await this.prisma.menuCategory.findUnique({ where: { id } });
        if (!category)
            throw new common_1.NotFoundException('Category not found');
        return this.prisma.menuCategory.update({ where: { id }, data: dto });
    }
    async deleteCategory(id) {
        const itemCount = await this.prisma.menuItem.count({ where: { categoryId: id } });
        if (itemCount > 0) {
            throw new common_1.NotFoundException('Category has menu items and cannot be deleted');
        }
        return this.prisma.menuCategory.delete({ where: { id } });
    }
    async createItem(branchId, dto) {
        return this.prisma.menuItem.create({
            data: {
                ...dto,
                branchId,
                available: dto.available ?? true,
            },
            include: { category: true },
        });
    }
    async findItems(branchId, categoryId, page = 0, limit = 50) {
        const take = Math.min(Math.max(limit, 1), 100);
        const skip = Math.max(page, 0) * take;
        return this.prisma.menuItem.findMany({
            where: { branchId, ...(categoryId && { categoryId }) },
            include: { category: true },
            orderBy: { name: 'asc' },
            take,
            skip,
        });
    }
    async updateItem(id, dto) {
        const item = await this.prisma.menuItem.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        return this.prisma.menuItem.update({
            where: { id },
            data: dto,
            include: { category: true },
        });
    }
    async deleteItem(id) {
        const item = await this.prisma.menuItem.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        return this.prisma.menuItem.delete({ where: { id } });
    }
    async toggleAvailability(id) {
        const item = await this.prisma.menuItem.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        return this.prisma.menuItem.update({
            where: { id },
            data: { available: !item.available },
        });
    }
};
exports.MenuService = MenuService;
exports.MenuService = MenuService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MenuService);
//# sourceMappingURL=menu.service.js.map