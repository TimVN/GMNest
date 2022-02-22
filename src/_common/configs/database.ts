import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  redis: {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: process.env.REDIS_PORT,
  },
}));
