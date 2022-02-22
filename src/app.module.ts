import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisClientModule } from './_common/modules/redis-client.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configs, getConfigFiles } from './_common/configs';

@Module({
  imports: [
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
        config: {
          host:
            process.env.REDIS_HOST || configService.get('database.redis.host'),
          password:
            process.env.REDIS_PASSWORD ||
            configService.get('database.redis.password'),
          port:
            +process.env.REDIS_PORT || configService.get('database.redis.port'),
        },
      }),
    }),

    RedisClientModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
