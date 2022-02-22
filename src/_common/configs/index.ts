import database from './database';

export const getConfigFiles = () => {
  if (process.env.HEROKU_APP) {
    return [];
  }

  console.log(process.env);

  return ['.env.development'];
};

export const configs = [database];
