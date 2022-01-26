import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientOptions,
  ClientsModule,
  ClientsModuleOptionsFactory,
  Transport,
} from '@nestjs/microservices';

@Injectable()
class RedisConfigService implements ClientsModuleOptionsFactory {
  constructor(private configService: ConfigService) {}

  createClientOptions(): ClientOptions {
    const redisConfig = this.configService.get('database.redis');
    console.log(`redisConfig`, redisConfig);
    return {
      transport: Transport.REDIS,
      options: {
        url: `redis://${redisConfig.host}:${redisConfig.port}`,
      },
    };
  }
}

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RedisClient',
        useClass: RedisConfigService,
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RedisClientModule {}
