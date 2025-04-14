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

    // Gera um novo sessionId para cada usuário criado
    const sessionId = randomUUID()

    // Salva o usuário criado no banco de dados com o sessionId
    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId
    })

    // Envia o sessionId como um cookie para o cliente
    res.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return res.status(201).send()
  })
}