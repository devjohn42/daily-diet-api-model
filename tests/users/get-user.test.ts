import { execSync } from "node:child_process"
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest"
import { app } from "../../src/app"
import { knex } from "../../src/database"

beforeAll(async () => {
  await knex('users').truncate()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

beforeEach(() => {
  execSync('npm run knex:rollback-all')
  execSync('npm run knex:migrate-run')
})

describe('Get user by id tests', () => {
  it.todo('should be able to get the user by id', async () => { })
  it.todo('should not be able to get the user white invalid id', async () => { })
})