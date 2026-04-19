import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecipeItemDto, UpdateRecipeItemDto } from './dto/recipes.dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  private async resolveIngredient(
    ingredientId?: string,
    ingredientName?: string,
    unit?: string,
    ingredientCost?: number,
  ) {
    if (ingredientId) {
      const ingredient = await this.prisma.ingredient.findUnique({ where: { id: ingredientId } });
      if (!ingredient) throw new NotFoundException('Ingredient not found');
      if (ingredientCost !== undefined && ingredientCost !== Number(ingredient.currentCost)) {
        return this.prisma.ingredient.update({
          where: { id: ingredientId },
          data: { currentCost: ingredientCost },
        });
      }
      return ingredient;
    }

    const name = ingredientName?.trim();
    if (!name) {
      throw new BadRequestException('Ingredient id or name is required');
    }

    let ingredient = await this.prisma.ingredient.findFirst({ where: { name } });
    if (!ingredient) {
      ingredient = await this.prisma.ingredient.create({
        data: {
          name,
          unit: unit ?? 'unit',
          currentCost: ingredientCost ?? 0,
          reorderLevel: 0,
        },
      });
    } else if (ingredientCost !== undefined && ingredientCost !== Number(ingredient.currentCost)) {
      ingredient = await this.prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { currentCost: ingredientCost },
      });
    }

    return ingredient;
  }

  async getRecipeItems(menuItemId: string, page = 0, limit = 10) {
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

  async createRecipeItem(menuItemId: string, dto: CreateRecipeItemDto) {
    const menuItem = await this.prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!menuItem) throw new NotFoundException('Menu item not found');

    const ingredient = await this.resolveIngredient(
      dto.ingredientId,
      dto.ingredientName,
      dto.unit,
      dto.unitCost,
    );
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
      throw new BadRequestException('Ingredient already exists in this recipe');
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

  async updateRecipeItem(menuItemId: string, recipeItemId: string, dto: UpdateRecipeItemDto) {
    const recipeItem = await this.prisma.recipeItem.findUnique({
      where: { id: recipeItemId },
      include: { ingredient: true },
    });
    if (!recipeItem || recipeItem.menuItemId !== menuItemId) {
      throw new NotFoundException('Recipe item not found');
    }

    const data: { ingredientId?: string; quantity?: number; unit?: string } = {};
    let ingredient = recipeItem.ingredient;

    if ((dto.ingredientId || dto.ingredientName) &&
        (dto.ingredientId !== recipeItem.ingredientId || dto.ingredientName?.trim() !== recipeItem.ingredient.name)) {
      ingredient = await this.resolveIngredient(
        dto.ingredientId,
        dto.ingredientName,
        dto.unit,
        dto.unitCost,
      );

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
          throw new BadRequestException('Ingredient already exists in this recipe');
        }
      }

      data.ingredientId = ingredient.id;
      if (dto.unit === undefined) {
        data.unit = ingredient.unit;
      }
    } else if (dto.unitCost !== undefined) {
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

  async deleteRecipeItem(menuItemId: string, recipeItemId: string) {
    const recipeItem = await this.prisma.recipeItem.findUnique({ where: { id: recipeItemId } });
    if (!recipeItem || recipeItem.menuItemId !== menuItemId) {
      throw new NotFoundException('Recipe item not found');
    }
    return this.prisma.recipeItem.delete({ where: { id: recipeItemId } });
  }

  async getRecipeImportSources(menuItemId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      select: { branchId: true },
    });
    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.findMany({
      where: {
        id: { not: menuItemId },
        branchId: menuItem.branchId,
        recipeItems: { some: {} },
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

  async importRecipeItems(menuItemId: string, sourceMenuItemId: string) {
    if (menuItemId === sourceMenuItemId) {
      throw new BadRequestException('Source and target menu items must be different');
    }

    const targetMenuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { recipeItems: true },
    });
    if (!targetMenuItem) {
      throw new NotFoundException('Target menu item not found');
    }
    if (targetMenuItem.recipeItems.length > 0) {
      throw new BadRequestException('Target menu item already has cost items');
    }

    const sourceMenuItem = await this.prisma.menuItem.findUnique({
      where: { id: sourceMenuItemId },
      include: { recipeItems: true },
    });
    if (!sourceMenuItem) {
      throw new NotFoundException('Source menu item not found');
    }
    if (sourceMenuItem.recipeItems.length === 0) {
      throw new BadRequestException('Source menu item does not have any cost items to import');
    }

    await this.prisma.recipeItem.createMany({
      data: sourceMenuItem.recipeItems.map((recipeItem) => ({
        menuItemId,
        ingredientId: recipeItem.ingredientId,
        quantity: recipeItem.quantity,
        unit: recipeItem.unit,
      })),
    });

    return this.getRecipeItems(menuItemId);
  }
}
