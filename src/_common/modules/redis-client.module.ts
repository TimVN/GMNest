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
    return {
      transport: Transport.REDIS,
      options: redisConfig,
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
