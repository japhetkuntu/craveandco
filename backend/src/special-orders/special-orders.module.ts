import { Module } from '@nestjs/common';
import { SpecialOrdersService } from './special-orders.service';
import { SpecialOrdersController } from './special-orders.controller';

@Module({
  providers: [SpecialOrdersService],
  controllers: [SpecialOrdersController],
})
export class SpecialOrdersModule {}
