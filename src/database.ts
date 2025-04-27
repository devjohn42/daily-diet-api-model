import { Knex, knex as setupKnex } from 'knex';
import { env } from './env';

export const config: Knex.Config = {
  client: env.DATABASE_CLIENT,
  connection: env.DATABASE_CLIENT === 'sqlite'
    ? { filename: env.DATABASE_URL }
    : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './database/migrations'
  }
}

// console.log('Database Client:', env.DATABASE_CLIENT);
// console.log('Database URL:', env.DATABASE_URL);

export const knex = setupKnex(config)

