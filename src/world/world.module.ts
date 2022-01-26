import { Module } from '@nestjs/common';
import { WorldGateway } from './world.gateway';
import { EncodingService } from '../_common/services/encoding.service';

@Module({
  providers: [EncodingService, WorldGateway],
})
export class WorldModule {}
