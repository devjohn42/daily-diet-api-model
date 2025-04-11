import fastify from "fastify"
import { randomUUID } from "node:crypto"
import { knex } from "./database"
import { env } from "./env"

const app = fastify()

app.get('/register-meal', async () => {
  const diet = await knex('diets').insert({
    id: randomUUID(),
    name: 'Banana',
    description: 'Banana with apple',
    in_diet: true

  })
    .returning('*')

  return diet
})

app.listen({
  port: env.PORT
}).then(() => {
  console.log('HTTP Server Running')
})
