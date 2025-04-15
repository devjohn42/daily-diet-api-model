import { FastifyInstance } from "fastify"
import { randomUUID } from "node:crypto"
import { z } from 'zod'
import { knex } from "../database"
import { dateFormatter } from "../helpers/date-formatter"

export const mealsRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', async (req, res) => {
    console.log(`[${req.method}] ${req.url}`)
  })

  app.post('/create-meal', async (req, res) => {
    const createMealsBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      in_diet: z.boolean()
    })

    const { name, description, in_diet } = createMealsBodySchema.parse(req.body)

    const sessionId = req.cookies.sessionId

    // Verifica se o sessionId é válido
    const user = await knex('users').where({ session_id: sessionId }).first()

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized: Invalid sessionId' })
    }

    // Cria a refeição associada ao usuário
    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      in_diet,
      created_at: dateFormatter(new Date()),
      session_id: sessionId
    })

    return res.status(201).send()
  })

  // get '/list-meals'
  app.get('/list-meals', async (req, res) => {
    const meals = await knex('meals').select()

    return {
      meals
    }
  })

  // get '/:id'
  app.get('/meals/:id', async (req, res) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = getMealParamsSchema.parse(req.params)

    const meal = await knex('meals').where({ id }).first()

    return {
      meal
    }
  })

  // patch '/:id'
  // delete '/:id'
}