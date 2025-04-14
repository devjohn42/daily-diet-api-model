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

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      in_diet,
      created_at: dateFormatter(new Date())
    })

    return res.status(201).send()
  })
}