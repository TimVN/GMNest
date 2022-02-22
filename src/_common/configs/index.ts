import database from './database';
import { Logger } from '@nestjs/common';

const logger = new Logger('Config');

export const getConfigFiles = () => {
  if (process.env.HEROKU_APP) {
    return [];
  }

  logger.log('Environment Variables');
  logger.log(process.env);

  return ['.env.development'];
};

export const configs = [database];
