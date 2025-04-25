import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { knex } from '../src/database'

let sessionIdPhill: string
let sessionIdJane: string

beforeAll(async () => {
  await knex('meals').truncate()
  await app.ready()

  await knex('users').insert([
    {
      id: randomUUID(),
      name: 'Phill Doe',
      email: 'pd@example.com',
      session_id: 'phillsession',
      metrics: JSON.stringify({
        totalMeals: 0,
        totalMealsInDiet: 0,
        totalMealsOutDiet: 0,
        sequenceOfMealsInTheDiet: 0,
      })
    },
    {
      id: randomUUID(),
      name: 'Jane Doe',
      email: 'jd@example.com',
      session_id: 'janession',
      metrics: JSON.stringify({
        totalMeals: 0,
        totalMealsInDiet: 0,
        totalMealsOutDiet: 0,
        sequenceOfMealsInTheDiet: 0,
      })
    }
  ])

  const users = await knex('users').select('session_id', 'email');
  sessionIdPhill = users.find((user) => user.email === 'pd@example.com')?.session_id || '';
  sessionIdJane = users.find((user) => user.email === 'jd@example.com')?.session_id || '';
})

afterAll(async () => {
  await knex('users').del()
  await app.close()
})

describe('Meals Routes', () => {
  // POST '/create-meal'
  describe('POST /create-meal', () => {
    it('should be able to create a meal for a user', async () => {
      const response = await request(app.server)
        .post('/meal/create-meal')
        .set('Cookie', [`sessionId=${sessionIdPhill}`])
        .send({
          name: 'Breakfast',
          description: 'Apple with banana',
          in_diet: true
        })

      expect(response.status).toBe(201)

      const meal = await knex('meals').where({ name: 'Breakfast' }).first()

      if (meal) {
        expect(meal).toBeDefined()
        expect(meal.name).toBe('Breakfast');
        expect(meal.in_diet).toBe(1);
      }

      const user = await knex('users').where({ session_id: sessionIdPhill }).first()

      if (user && typeof user.metrics === 'string') {
        const metrics = JSON.parse(user.metrics);
        expect(metrics.totalMeals).toBe(1);
        expect(metrics.totalMealsInDiet).toBe(1);
        expect(metrics.totalMealsOutDiet).toBe(0);
        expect(metrics.sequenceOfMealsInTheDiet).toBe(1); // Sequência incrementada
      }

    })
    it('should not be able to create a meal with invalid data', async () => {
      const response = await request(app.server)
        .post('/meal/create-meal')
        .set('Cookie', [`sessionId=${sessionIdPhill}`])
        .send({
          name: '', // Inválido
          description: 'Invalid meal',
          in_diet: 'not-a-boolean' // Inválido
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error', 'Validation error')
    })
    it('should not be able to create a meal without a sessionId', async () => {
      const response = await request(app.server)
        .post('/meal/create-meal')
        .send({
          name: 'Lunch',
          description: 'Grilled chicken with salad',
          in_diet: true
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error', 'Unauthorized!') // o valor do erro precisa ser o mesmo feito no check-session-id-exists.ts
    })
  })

  // GET '/list-meals'
  describe('Get meals list tests', () => {
    it.todo('User can get the meals list', async () => { })
  })

  // GET '/:id'
  describe('Get meal by id tests', () => {
    it.todo('User can get the meal by id', async () => { })
  })

  // PATCH '/:id'
  describe('Update meal by id tests', () => {
    it.todo('User can update the meal by id', async () => { })
  })

  // DELETE '/:id'
  describe('Delte meal by id tests', () => {
    it.todo('User can delete the meal by id', async () => { })
  })
})