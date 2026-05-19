import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PromotionsModule } from '../promotions/promotions.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [PromotionsModule, FilesModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
