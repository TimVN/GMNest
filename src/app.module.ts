import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisClientModule } from './_common/modules/redis-client.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { configs, getConfigFiles } from './_common/configs';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client/game'),
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: configs,
      envFilePath: getConfigFiles(),
    }),

    RedisModule.forRootAsync({
      imports: [ConfigService],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: configService.get('database.redis'),
      }),
    }),

    RedisClientModule,
    ChatModule,
  ],
  providers: [AppService],
})
export class AppModule {}
