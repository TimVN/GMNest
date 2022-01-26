import { Global, Injectable, Module } from '@nestjs/common';

@Injectable()
export class MonsterPersistenceService {}

@Global()
@Module({
  providers: [MonsterPersistenceService],
  exports: [MonsterPersistenceService],
})
export class MonsterModule {}
