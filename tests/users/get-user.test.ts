import { execSync } from "node:child_process"
import { randomUUID } from "node:crypto"
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
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
  it('should be able to get the user by id', async () => {
    const [user] = await knex('users').insert(
      {
        id: randomUUID(),
        name: 'John Doe',
        email: 'johndoe@example.com',
        session_id: 'johnsession'
      },
      ['id']
    )

    // console.log(user.id)

    const response = await request(app.server).get(`/user/users/${user.id}`)

    // console.log(response.body)

    expect(response.status).toBe(200)

    expect(response.body.user.name).toBe('John Doe')
    expect(response.body.user.email).toBe('johndoe@example.com')
  })
  it('should not be able to get the user white invalid id', async () => {
    const response = await request(app.server).get('/user/non-existent-id');

    // Verifica se o status HTTP é 404 (Not Found)
    expect(response.status).toBe(404);

    // Verifica se a mensagem de erro está presente
    expect(response.body).toHaveProperty('error');
  })
})