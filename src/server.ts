import fastify from "fastify"
import { randomUUID } from "node:crypto"
import { knex } from "./database"

const app = fastify()

app.get('/diet', async () => {
  const diet = await knex('diets').insert({
    id: randomUUID(),
    name: 'Test Daily Diet',
    description: 'First diet of the day',
    in_diet: true

  })

  return diet
})

app.listen({
  port: 3333
}).then(() => {
  console.log('HTTP Server Running')
})
