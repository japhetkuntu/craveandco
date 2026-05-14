import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { normalizeLimit, normalizePage } from '../common/pagination';
import { RecipesService } from './recipes.service';
import {
  CreateRecipeItemDto,
  UpdateRecipeItemDto,
  ImportRecipeItemsDto,
} from './dto/recipes.dto';

@Controller('api/v1/menu/items/:itemId/recipe-items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecipesController {
  constructor(private recipes: RecipesService) {}

  @Get()
  @Roles('OWNER', 'OPERATIONS_MANAGER', 'KITCHEN_STAFF')
  getRecipeItems(
    @Param('itemId') itemId: string,
    @Query('page') page = '0',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = normalizePage(page);
    const limitNumber = normalizeLimit(limit);
    return this.recipes.getRecipeItems(itemId, pageNumber, limitNumber);
  }

  @Post()
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  createRecipeItem(
    @Param('itemId') itemId: string,
    @Body() dto: CreateRecipeItemDto,
  ) {
    return this.recipes.createRecipeItem(itemId, dto);
  }

  @Get('import-sources')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  getRecipeImportSources(@Param('itemId') itemId: string) {
    return this.recipes.getRecipeImportSources(itemId);
  }

  @Post('import')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  importRecipeItems(
    @Param('itemId') itemId: string,
    @Body() dto: ImportRecipeItemsDto,
  ) {
    const sourceMenuItemIds = dto.sourceMenuItemIds?.length
      ? dto.sourceMenuItemIds
      : dto.sourceMenuItemId
        ? [dto.sourceMenuItemId]
        : [];
    const importMode = dto.importMode ?? 'SNAPSHOT';
    return this.recipes.importRecipeItems(itemId, sourceMenuItemIds, importMode);
  }

  @Patch(':id')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  updateRecipeItem(
    @Param('itemId') itemId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecipeItemDto,
  ) {
    return this.recipes.updateRecipeItem(itemId, id, dto);
  }

  @Delete(':id')
  @Roles('OWNER', 'OPERATIONS_MANAGER')
  deleteRecipeItem(@Param('itemId') itemId: string, @Param('id') id: string) {
    return this.recipes.deleteRecipeItem(itemId, id);
  }
}
