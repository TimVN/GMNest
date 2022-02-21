import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { WorldModule } from './world/world.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './_common/database/entities/user.entity';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisClientModule } from './_common/modules/redis-client.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configs } from './_common/configs';
import { MonsterModule } from './_common/modules/monster.module';
import { PlayersModule } from './players/players.module';
import {
  Inventory,
  InventoryItem,
} from './_common/database/entities/inventory.entity';
import { Item } from './_common/database/entities/item.entity';
import { InventoryModule } from './inventory/inventory.module';
import { ItemCategory } from './_common/database/entities/item-category.entity';
import { TradingModule } from './trading/trading.module';
import { AppGateway } from './app.gateway';
import { PartyModule } from './party/party.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configs,
      envFilePath: ['.env.development'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigService],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.postgres.host'),
        port: configService.get('database.postgres.port'),
        username: configService.get('database.postgres.username'),
        password: configService.get('database.postgres.password'),
        database: configService.get('database.postgres.database'),
        entities: [User, Inventory, InventoryItem, ItemCategory, Item],
        synchronize: true,
      }),
    }),

    RedisModule.forRootAsync({
      imports: [ConfigService],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: {
          host: configService.get('database.redis.host'),
          port: configService.get('database.redis.port'),
        },
      }),
    }),

    EventEmitterModule.forRoot(),
    RedisClientModule,
    ChatModule,
    AuthModule,
    WorldModule,
    MonsterModule,
    PlayersModule,
    InventoryModule,
    TradingModule,
    PartyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
