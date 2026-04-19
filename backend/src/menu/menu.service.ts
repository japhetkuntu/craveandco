import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/menu.dto';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async createCategory(dto: CreateCategoryDto) {
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

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.menuCategory.update({ where: { id }, data: dto });
  }

  async deleteCategory(id: string) {
    const itemCount = await this.prisma.menuItem.count({ where: { categoryId: id } });
    if (itemCount > 0) {
      throw new NotFoundException('Category has menu items and cannot be deleted');
    }
    return this.prisma.menuCategory.delete({ where: { id } });
  }

  async createItem(branchId: string, dto: CreateMenuItemDto) {
    return this.prisma.menuItem.create({
      data: {
        ...dto,
        branchId,
        available: dto.available ?? true,
        options: dto.options as any,
      },
      include: { category: true },
    });
  }

  async findItems(branchId: string, categoryId?: string, page = 0, limit = 50) {
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

  async updateItem(id: string, dto: UpdateMenuItemDto) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    return this.prisma.menuItem.update({
      where: { id },
      data: { ...dto, options: dto.options as any },
      include: { category: true },
    });
  }

  async deleteItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    return this.prisma.menuItem.delete({ where: { id } });
  }

  async toggleAvailability(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    return this.prisma.menuItem.update({
      where: { id },
      data: { available: !item.available },
    });
  }
}
