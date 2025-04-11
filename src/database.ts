import 'dotenv/config'
import { Knex, knex as setupKnex } from 'knex'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL env not found.')
}

export const config: Knex.Config = ({
  client: 'sqlite',
  useNullAsDefault: true,
  connection: {
    filename: process.env.DATABASE_URL
  },
  migrations: {
    extension: 'ts',
    directory: './database/migrations'
  }
})

export const knex = setupKnex(config)

//creates migration to add-session-id-to-diets