import { registerAs } from '@nestjs/config';

export const redisConfig = () => {
  if (process.env.REDISTOGO_URL) {
    return {
      url: process.env.REDISTOGO_URL,
      password: process.env.REDIS_PASSWORD || undefined,
    };
  }

  return {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD || undefined,
    port: +process.env.REDIS_PORT,
  };
};

export default registerAs('database', () => ({ redis: redisConfig() }));
