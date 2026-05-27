import { Module } from '@nestjs/common';
import { RaffleAdminController } from './raffle-admin.controller';
import { RaffleAdminService } from './raffle-admin.service';

@Module({
  controllers: [RaffleAdminController],
  providers: [RaffleAdminService],
})
export class RaffleAdminModule {}
