import cookie from '@fastify/cookie'
import { fastify } from "fastify"
import { mealsRoutes } from "./routes/meals"
import { usersRoutes } from "./routes/users"

export const app = fastify()

app.register(cookie)

app.register(mealsRoutes, {
  prefix: 'meal'
})

app.register(usersRoutes, {
  prefix: 'user'
})