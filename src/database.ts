import { Knex, knex as setupKnex } from 'knex'
import { env } from './env'

export const config: Knex.Config = ({
  client: 'sqlite',
  useNullAsDefault: true,
  connection: {
    filename: env.DATABASE_URL
  },
  migrations: {
    extension: 'ts',
    directory: './database/migrations'
  }
})

export const knex = setupKnex(config)

