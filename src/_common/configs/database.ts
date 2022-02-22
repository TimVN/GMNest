import { registerAs } from '@nestjs/config';

export const redisConfig = () => {
  if (+process.env.IN_HEROKU) {
    return {
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
    };
  }

  return {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: process.env.REDIS_PORT,
  };
};

export default registerAs('database', () => ({ redis: redisConfig() }));
