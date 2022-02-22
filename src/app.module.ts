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
      useFactory: (configService: ConfigService) => {
        console.log('Config in the module forroot');
        console.log(configService.get('database.redis'));
        return {
          config: configService.get('database.redis'),
        };
      },
    }),

    RedisClientModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
