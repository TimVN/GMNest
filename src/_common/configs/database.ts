import { registerAs } from '@nestjs/config';

export const redisConfig = () => {
  if (process.env.REDISTOGO_URL) {
    const parts = process.env.REDISTOGO_URL.substring(8).split('@');

    const [password] = parts[0].split(':');
    const [host, port] = parts[1].split(':');

    return {
      host,
      port,
      password,
    };
  }

  return {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD || undefined,
    port: +process.env.REDIS_PORT,
  };
};

export default registerAs('database', () => ({ redis: redisConfig() }));
