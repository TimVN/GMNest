import { Module } from '@nestjs/common';
import { InventoryService } from '../inventory/inventory.service';
import { TradingGateway } from './trading.gateway';
import { TradingService } from './trading.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Inventory,
  InventoryItem,
} from '../_common/database/entities/inventory.entity';
import { Item } from '../_common/database/entities/item.entity';
import { ItemDropsService } from '../_common/services/item-drops.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, InventoryItem, Item])],
  providers: [
    InventoryService,
    ItemDropsService,
    TradingGateway,
    TradingService,
  ],
})
export class TradingModule {}
