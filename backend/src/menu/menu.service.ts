import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import {
  CreateMenuItemDto,
  UpdateMenuItemDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/menu.dto';

@Injectable()
export class MenuService {
  private readonly groupedComponentsOptionId = '__meta_grouped_menu_components';

  constructor(
    private prisma: PrismaService,
    private files: FilesService,
  ) {}

  private splitVisibleAndHiddenOptions(options: unknown) {
    if (!Array.isArray(options)) {
      return { visible: [], hidden: [] as any[] };
    }

    const visible: any[] = [];
    const hidden: any[] = [];
    options.forEach((option) => {
      if ((option as { id?: string })?.id === this.groupedComponentsOptionId) {
        hidden.push(option);
      } else {
        visible.push(option);
      }
    });

    return { visible, hidden };
  }

  private toPublicMenuItem<T extends { options?: unknown; imageKey?: string | null }>(item: T) {
    const { visible, hidden } = this.splitVisibleAndHiddenOptions(item.options);
    const grouped = hidden.find((h: any) => h.id === this.groupedComponentsOptionId);
    const groupedComponentIds: string[] = grouped
      ? (grouped.values ?? []).map((v: any) => v.id as string)
      : [];
    return {
      ...item,
      options: visible,
      groupedComponentIds,
      imageUrl: item.imageKey ? this.files.getImageUrl(item.imageKey) : null,
    };
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.menuCategory.create({ data: dto });
  }

  async findCategories(page = 0, limit = 50, excludeInternalOnly = false) {
    const take = Math.min(Math.max(limit, 10), 100);
    const skip = Math.max(page, 0) * take;

    return this.prisma.menuCategory.findMany({
      where: { active: true, ...(excludeInternalOnly && { internalOnly: false }) },
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
    const created = await this.prisma.menuItem.create({
      data: {
        branchId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageKey: dto.imageKey ?? undefined,
        available: dto.available ?? true,
        dayparts: dto.dayparts ?? ['ALL'],
        options: dto.options as any,
      },
      include: { category: true },
    });
    return this.toPublicMenuItem(created);
  }

  async findItems(branchId: string, categoryId?: string, page = 0, limit = 50, excludeInternalOnly = false) {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = Math.max(page, 0) * take;

    const items = await this.prisma.menuItem.findMany({
      where: {
        branchId,
        ...(categoryId && { categoryId }),
        ...(excludeInternalOnly && { category: { internalOnly: false } }),
      },
      include: { category: true },
      orderBy: [
        { imageKey: { sort: 'asc', nulls: 'last' } },
        { name: 'asc' },
      ],
      take,
      skip,
    });

    return items.map((item) => this.toPublicMenuItem(item));
  }

  async updateItem(id: string, dto: UpdateMenuItemDto) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');

    const data: any = {
      name: dto.name ?? item.name,
      description: dto.description ?? item.description,
      price: dto.price ?? item.price,
      categoryId: dto.categoryId ?? item.categoryId,
      imageKey: dto.imageKey === undefined ? item.imageKey : dto.imageKey,
      available: dto.available ?? item.available,
      dayparts: dto.dayparts ?? item.dayparts,
      options: item.options,
    };

    if (dto.options !== undefined) {
      const { hidden } = this.splitVisibleAndHiddenOptions(item.options);
      data.options = [...(dto.options as any[]), ...hidden] as any;
    }

    const updated = await this.prisma.menuItem.update({
      where: { id },
      data,
      include: { category: true },
    });

    // Clean up old image from storage if it was replaced
    if (
      dto.imageKey !== undefined &&
      item.imageKey &&
      item.imageKey !== dto.imageKey
    ) {
      await this.files.deleteImage(item.imageKey).catch(() => null);
    }

    return this.toPublicMenuItem(updated);
  }

  async deleteItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    const deleted = await this.prisma.menuItem.delete({ where: { id } });
    if (item.imageKey) {
      await this.files.deleteImage(item.imageKey).catch(() => null);
    }
    return deleted;
  }

  async toggleAvailability(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Menu item not found');
    const updated = await this.prisma.menuItem.update({
      where: { id },
      data: { available: !item.available },
    });
    return this.toPublicMenuItem(updated);
  }
}
