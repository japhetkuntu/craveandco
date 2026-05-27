import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RaffleAdminService } from './raffle-admin.service';
import { RedeemSpinDto } from './dto/redeem-spin.dto';

@Controller('api/v1/raffle')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'GROWTH_LEAD')
export class RaffleAdminController {
  constructor(private raffleAdmin: RaffleAdminService) {}

  @Get('entries')
  listEntries(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    return this.raffleAdmin.listEntries({
      page: pageNumber,
      limit: limitNumber,
      search: search?.trim() || undefined,
    });
  }

  @Get('stats')
  stats() {
    return this.raffleAdmin.getStats();
  }

  @Get('resolve/:code')
  resolve(@Param('code') code: string, @Req() req: any) {
    return this.raffleAdmin.resolveByCode(code, req.user.branchId);
  }

  @Post('spins/:id/redeem')
  redeemSpin(@Param('id') id: string, @Req() req: any, @Body() dto: RedeemSpinDto) {
    return this.raffleAdmin.redeemSpin(id, req.user.userId, dto);
  }

  @Post('spins/:id/unredeem')
  unredeemSpin(@Param('id') id: string) {
    return this.raffleAdmin.unredeemSpin(id);
  }
}
