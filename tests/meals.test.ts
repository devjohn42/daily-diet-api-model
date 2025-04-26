import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { knex } from '../src/database'
import { dateFormatter } from '../src/helpers/date-formatter'
import { updateMealsInDiet, updateSequenceOfMealsInDiet, updateTotalMeals } from '../src/services/user-metrics-service'

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

  execSync('npm run knex:rollback-all')
  execSync('npm run knex:migrate-run')
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
  describe('GET /list-meals', () => {
    it('User can get the meals list', async () => {
      const response = await request(app.server)
        .get('/meal/list-meals')
        .set('Cookie', [`sessionId=${sessionIdPhill}`])

      // console.log(response.body.meals)
      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.meals)).toBe(true)
      expect(response.body.meals).toHaveLength(1)

      response.body.meals.forEach((meal: any) => {
        meal.in_diet = Boolean(meal.in_diet)

        expect(meal).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            in_diet: expect.any(Boolean),
            created_at: expect.any(String),
            session_id: expect.any(String),
          })
        )
      })
    })
  })

  // GET '/:id'
  describe('GET /:id', () => {
    it('should be able to get the meal by id', async () => {
      const [meal] = await knex('meals').insert({
        id: randomUUID(),
        name: 'Dinner',
        description: 'Steak with vegetables',
        in_diet: true,
        created_at: dateFormatter(new Date()),
        session_id: sessionIdJane
      }, ['id'])
      const response = await request(app.server)
        .get(`/meal/meals/${meal.id}`) //meal.id
        .set('Cookie', [`sessionId=${sessionIdJane}`])


      expect(response.status).toBe(200)

      expect(response.body.meal).toEqual(
        expect.objectContaining({
          id: meal.id,
          name: 'Dinner',
          description: 'Steak with vegetables',
          in_diet: true,
          session_id: sessionIdJane,
          created_at: expect.any(String)
        })
      )
    })
    it('should return 404 if the meal does not exist', async () => {
      const response = await request(app.server)
        .get('/meal/meals/non-existent-id')
        .set('Cookie', [`sessionId=${sessionIdJane}`])

      expect(response.status).toBe(404)

      expect(response.body).toHaveProperty('error', 'Meal Not Found')
    })
    it('should return 401 if sessionId is not provided', async () => {
      const [meal] = await knex('meals').insert({
        id: randomUUID(),
        name: 'Junk Food',
        description: 'Hamburguer',
        in_diet: false,
        created_at: dateFormatter(new Date()),
        session_id: sessionIdJane
      }, ['id'])

      const response = await request(app.server).get(`/meal/meals/${meal.id}`)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error', 'Unauthorized!')
    })
  })

  // PATCH '/:id'
  describe('PATCH /:id', () => {
    it('should be able to update the meal by id', async () => {
      const [meal] = await knex('meals').insert({
        id: randomUUID(),
        name: 'Dinner',
        description: 'Past with cheese',
        in_diet: false,
        created_at: dateFormatter(new Date()),
        session_id: sessionIdJane
      }, ['id'])
      const response = await request(app.server)
        .patch(`/meal/meals/${meal.id}`)
        .set('Cookie', [`sessionId=${sessionIdJane}`])
        .send({
          description: 'Organic pasta with vegetables',
          in_diet: true,

        })

      expect(response.status).toBe(200)

      const updatedMeal = await knex('meals').where({ id: meal.id }).first()

      // console.log(updatedMeal)

      expect(updatedMeal?.description).toEqual('Organic pasta with vegetables')
      expect(Boolean(updatedMeal?.in_diet)).toEqual(true)
      expect(updatedMeal).toEqual(
        expect.objectContaining({
          id: meal.id,
          name: 'Dinner',
          description: 'Organic pasta with vegetables',
          in_diet: updatedMeal?.in_diet,
          session_id: sessionIdJane,
        })
      );
    })
    it('should return 404 if the meal does not exist', async () => {
      const response = await request(app.server)
        .get('/meal/meals/non-existent-id')
        .set('Cookie', [`sessionId=${sessionIdJane}`])

      expect(response.status).toBe(404)

      expect(response.body).toHaveProperty('error', 'Meal Not Found')
    })
    it('should return 401 if sessionId is not provided', async () => {
      const [meal] = await knex('meals').insert({
        id: randomUUID(),
        name: 'Dinner',
        description: 'Past with cheese',
        in_diet: false,
        created_at: dateFormatter(new Date()),
        session_id: sessionIdJane
      }, ['id'])
      const response = await request(app.server)
        .patch(`/meal/meals/${meal.id}`)
        .send({
          description: 'Organic pasta with vegetables',
          in_diet: true,

        })
      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error', 'Unauthorized!')
    })
    it('shoudl return 400 if the request body is invalid', async () => {
      const [meal] = await knex('meals').insert(
        {
          id: randomUUID(),
          name: 'Snack',
          description: 'Protein bar',
          in_diet: true,
          created_at: dateFormatter(new Date()),
          session_id: sessionIdJane,
        },
        ['id']
      );

      const response = await request(app.server)
        .patch(`/meal/meals/${meal.id}`)
        .set('Cookie', [`sessionId=${sessionIdJane}`])
        .send({
          name: '', // Nome inválido (vazio)
          description: 123, // Descrição inválida (não é string)
          in_diet: 'not-a-boolean', // Valor inválido (não é booleano)
        });

      // console.log(response.body)

      expect(response.status).toBe(400);

      expect(response.body).toHaveProperty('error', 'Validation error');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    })
  })

  // DELETE '/:id'
  describe('DELETE /:id', () => {
    it('should be able to delete a meal by id', async () => {
      // Insere uma refeição no banco de dados para o teste
      const [meal] = await knex('meals').insert(
        {
          id: randomUUID(),
          name: 'Lunch',
          description: 'Grilled chicken with salad',
          in_diet: true,
          created_at: dateFormatter(new Date()),
          session_id: sessionIdPhill,
        },
        ['id']
      );

      // Faz a requisição para deletar a refeição
      const response = await request(app.server)
        .delete(`/meal/meals/${meal.id}`)
        .set('Cookie', [`sessionId=${sessionIdPhill}`]);

      // Verifica o status da resposta
      expect(response.status).toBe(204);

      // Verifica se a refeição foi removida do banco de dados
      const deletedMeal = await knex('meals').where({ id: meal.id }).first();
      expect(deletedMeal).toBeUndefined();
    })
    it('should return 404 if the meal does not exist', async () => {
      const response = await request(app.server)
        .get('/meal/meals/non-existent-id')
        .set('Cookie', [`sessionId=${sessionIdJane}`])

      expect(response.status).toBe(404)

      expect(response.body).toHaveProperty('error', 'Meal Not Found')
    });
  })
})