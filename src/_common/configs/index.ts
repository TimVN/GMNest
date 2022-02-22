import database from './database';

export const getConfigFiles = () => {
  return ['.env.development', '.env'];
};

export const configs = [database];
