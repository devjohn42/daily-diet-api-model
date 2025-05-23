import { FastifyInstance } from "fastify"
import { randomUUID } from "node:crypto"
import { z } from 'zod'
import { knex } from "../database"

export const usersRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', async (req, res) => {
    console.log(`[${req.method}] ${req.url}`)
  })

  // post '/create-user'
  app.post('/create-user', async (req, res) => {
    try {
      const createUserBodySchema = z.object({
        name: z.string().min(3, 'Name must be at least 3 characters long'),
        email: z.string().email('Invalid email format')
      })

      const { name, email } = createUserBodySchema.parse(req.body)

      const existintUser = await knex('users').where({ email }).first()

      if (existintUser) {
        return res.status(400).send({
          error: 'Email already in use'
        })
      }

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
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).send({
          error: 'Validation error',
          details: error.errors
        })
      }

      console.log(error)
      return res.status(500).send({ error: 'Internal Server Error' })
    }
  })

  // get '/list-users'
  app.get('/list-users', async (req, res) => {
    try {
      const users = await knex('users').select()

      // if (users.length === 0) {
      //   return res.status(404).send({ error: 'No users found' });
      // }

      users.forEach(user => {
        if (typeof user.metrics === 'string') {
          user.metrics = JSON.parse(user.metrics)
        }
      })
      return res.status(200).send({ users })
    } catch (error) {
      console.log(error)
      return res.status(500).send({
        error: 'Internal Server Error'
      })
    }

  })

  // get '/:id'
  app.get('/users/:id', async (req, res) => {
    try {
      const getUserParamsSchema = z.object({
        id: z.string().uuid()
      })

      const { id } = getUserParamsSchema.parse(req.params)

      const user = await knex('users').where({ id }).first()

      if (user && typeof user.metrics === 'string') {
        user.metrics = JSON.parse(user.metrics)
      }
      if (user?.id !== id) {
        res.status(404).send({
          error: 'User Not Found'
        })
      }
      return res.status(200).send({ user })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(404).send({
          error: 'User Not Found',
          details: error.errors
        })
      }
      console.log(error)
      return res.send(500).send({
        error: 'Internal Server Error'
      })
    }

  })
}