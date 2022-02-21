import { Module } from '@nestjs/common';
import { PartyGateway } from './party.gateway';
import { PartyService } from './party.service';
import { User } from '../_common/database/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [PartyGateway, PartyService],
})
export class PartyModule {}
