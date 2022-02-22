import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    password: process.env.REDIS_PASSWORD || null,
    port: process.env.REDIS_PORT || 6379,
  },
}));
