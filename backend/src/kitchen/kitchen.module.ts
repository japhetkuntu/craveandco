import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';

@Module({
  imports: [AlertsModule],
  providers: [KitchenService],
  controllers: [KitchenController],
})
export class KitchenModule {}
