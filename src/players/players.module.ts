import { Module } from '@nestjs/common';
import { PlayersGateway } from './players.gateway';

@Module({
  providers: [PlayersGateway],
})
export class PlayersModule {}
