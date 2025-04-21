import { FastifyInstance } from "fastify"
import { randomUUID } from "node:crypto"
import { z } from 'zod'
import { knex } from "../database"

export const usersRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', async (req, res) => {
    console.log(`[${req.method}] ${req.url}`)
  })

  app.post('/create-user', async (req, res) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string()
    })

    const { name, email } = createUserBodySchema.parse(req.body)

    // Gera um novo sessionId para cada usuário criado
    const sessionId = randomUUID()
    const metrics = {
      totalMeals: 0,
      totalMealsInDiet: 0,
      totalMealsOutDiet: 0,
      sequenceOfMealsInTheDiet: 0
    }

    // Salva o usuário criado no banco de dados com o sessionId
    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
      metrics
    })

    // Envia o sessionId como um cookie para o cliente
    res.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return res.status(201).send()
  })

  // get '/list-users'
  app.get('/list-users', async (req, res) => {
    const users = await knex('users').select()

    users.forEach(user => {
      if (typeof user.metrics === 'string') {
        user.metrics = JSON.parse(user.metrics)
      }
    })
    return {
      users
    }
  })

  // get '/:id'
  app.get('/users/:id', async (req, res) => {

    const getUserParamsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = getUserParamsSchema.parse(req.params)

    const user = await knex('users').where({ id }).first()

    if (user && typeof user.metrics === 'string') {
      user.metrics = JSON.parse(user.metrics)
    }
    return {
      user
    }
  })
}