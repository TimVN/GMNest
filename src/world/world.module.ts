import { Module } from '@nestjs/common';
import { WorldGateway } from './world.gateway';
import { ItemDropsService } from '../_common/services/item-drops.service';

@Module({
  providers: [ItemDropsService, WorldGateway],
})
export class WorldModule {}
