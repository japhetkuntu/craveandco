import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MenuService } from '../menu/menu.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/v1/public/menu')
export class PublicMenuController {
  constructor(
    private menu: MenuService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Get('items')
  async findItems(
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    const resolvedBranchId = await this.resolveBranchId(branchId);
    const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    return this.menu.findItems(resolvedBranchId, categoryId, pageNumber, limitNumber);
  }

  @Get('categories')
  async findCategories(
    @Query('branchId') branchId?: string,
    @Query('page') page = '0',
    @Query('limit') limit = '50',
  ) {
    await this.resolveBranchId(branchId);
    const pageNumber = Math.max(parseInt(page, 10) || 0, 0);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    return this.prisma.menuCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      take: limitNumber,
      skip: pageNumber * limitNumber,
    });
  }

  private async resolveBranchId(branchId?: string) {
    if (branchId) return branchId;
    const envBranchId = this.config.get<string>('DEFAULT_BRANCH_ID');
    if (envBranchId) return envBranchId;
    const branch = await this.prisma.branch.findFirst({ where: { active: true }, orderBy: { createdAt: 'asc' } });
    if (!branch) {
      throw new NotFoundException('No active branch configured');
    }
    return branch.id;
  }
}
