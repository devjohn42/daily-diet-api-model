import { FastifyInstance } from "fastify"
import { randomUUID } from "node:crypto"
import { z } from 'zod'
import { knex } from "../database"
import { dateFormatter } from "../helpers/date-formatter"

export const mealsRoutes = async (app: FastifyInstance) => {
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
}