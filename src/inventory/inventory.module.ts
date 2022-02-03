import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Inventory,
  InventoryItem,
} from '../_common/database/entities/inventory.entity';
import { InventoryGateway } from './inventory.gateway';
import { InventoryService } from './inventory.service';
import { ItemDropsService } from '../_common/services/item-drops.service';
import { Item } from '../_common/database/entities/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Inventory, InventoryItem, Item])],
  providers: [InventoryService, ItemDropsService, InventoryGateway],
})
export class InventoryModule {}
