import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [AlertsModule, FilesModule],
  providers: [KitchenService],
  controllers: [KitchenController],
})
export class KitchenModule {}
