import fastify from "fastify"
import { randomUUID } from "node:crypto"
import { knex } from "./database"

const app = fastify()

app.get('/register-meal', async () => {
  const diet = await knex('diets').insert({
    id: randomUUID(),
    name: 'Pizza',
    description: 'Pepperoni with Cheese',
    in_diet: false

  })
    .returning('*')

  return diet
})

app.listen({
  port: 3333
}).then(() => {
  console.log('HTTP Server Running')
})
