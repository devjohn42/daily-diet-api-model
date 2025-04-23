import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../../src/app'
import { knex } from '../../src/database'

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

// GET '/list-users'
describe('Get users list tests', () => {
  it('should be able to get the users list', async () => {
    await knex('users').insert({
      name: 'Mark Doe',
      email: 'markdoe@example.com',
    });

    const response = await request(app.server).get('/user/list-users').send()

    // console.log(response.body)
    expect(response.status).toBe(200)
    expect(response.body.users.length).toBeGreaterThan(0)
  })
  it('should return an empty list if no users are found', async () => {
    await knex('users').truncate()

    const response = await request(app.server).get('/user/list-users')

    expect(response.status).toBe(200)

    expect(response.body.users).toHaveLength(0)
  })
  it('should return users with the correct structure', async () => {
    await knex('users').insert({
      id: randomUUID(),
      name: 'John Doe',
      email: 'johndoe@example.com',
      session_id: 'john-session',
      metrics: JSON.stringify({
        totalMeals: 0,
        totalMealsInDiet: 0,
        totalMealsOutDiet: 0,
        sequenceOfMealsInTheDiet: 0
      })
    })

    const response = await request(app.server).get('/user/list-users')

    expect(response.status).toBe(200)
    expect(response.body.users).toHaveLength(1)
    expect(response.body.users[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        email: expect.any(String),
        session_id: expect.any(String),
        metrics: expect.any(Object)
      })
    )
  })
})
