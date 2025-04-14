import fastify from "fastify"
import { env } from "./env"
import { mealsRoutes } from "./routes/meals"
import { usersRoutes } from "./routes/users"

const app = fastify()

app.register(mealsRoutes, {
  prefix: 'meal'
})

app.register(usersRoutes, {
  prefix: 'user'
})

app.listen({
  port: env.PORT
}).then(() => {
  console.log('HTTP Server Running')
})
