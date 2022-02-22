import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  if (+process.env.IN_HEROKU) {
    return {
      url: process.env.REDIS_URL,
    };
  }

  return {
    redis: {
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
      port: process.env.REDIS_PORT,
    },
  };
});
