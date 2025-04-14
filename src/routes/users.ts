import { FastifyInstance } from "fastify"
import { randomUUID } from "node:crypto"
import { z } from 'zod'
import { knex } from "../database"

export const usersRoutes = async (app: FastifyInstance) => {
  app.post('/create-user', async (req, res) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string()
    })

    const { name, email } = createUserBodySchema.parse(req.body)

    await knex('users').insert({
      id: randomUUID(),
      name,
      email
    })

    return res.status(201).send()
  })
}