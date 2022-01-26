import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './_common/adapters/redis-io-adapter';
import { Logger } from '@nestjs/common';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  app.enableCors();

  await app.listen(3000);
}

bootstrap().then(() => {
  logger.log('Bootstrapped');
});
