import { FastifyInstance } from "fastify"
import { randomUUID } from "node:crypto"
import { z } from 'zod'
import { knex } from "../database"
import { dateFormatter } from "../helpers/date-formatter"
import { checkSessionIdExists } from "../middlewares/check-session-id-exists"
import { updateMealsInDiet, updateSequenceOfMealsInDiet, updateTotalMeals } from "../services/user-metrics-service"

export const mealsRoutes = async (app: FastifyInstance) => {
  app.addHook('preHandler', async (req, res) => {
    console.log(`[${req.method}] ${req.url}`)
  })

  app.addHook('preHandler', checkSessionIdExists)

  // post '/create-meal'
  app.post('/create-meal', async (req, res) => {
    try {
      const createMealsBodySchema = z.object({
        name: z.string().min(5, 'Name must be at least 5 characteres long'),
        description: z.string(),
        in_diet: z.boolean()
      })

      const { name, description, in_diet } = createMealsBodySchema.parse(req.body)

      const sessionId = req.cookies.sessionId as string | undefined

      // Verifica se o sessionId é válido
      const user = await knex('users')
        .where({ session_id: sessionId })
        .first()

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

      if (!sessionId) {
        return res.status(400).send({ error: 'Session ID is required' });
      }
      await updateTotalMeals(sessionId, true)
      await updateMealsInDiet(sessionId, in_diet, true)
      await updateSequenceOfMealsInDiet(sessionId)

      return res.status(201).send()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).send({
          error: 'Validation error',
          details: error.errors
        })
      }

      console.log(error)
      return res.status(500).send({ error: 'Internal Server Error' })
    }

  })

  // get '/list-meals'
  app.get('/list-meals', async (req, res) => {
    try {
      const sessionId = req.cookies.sessionId;

      if (!sessionId) {
        return res.status(400).send({ error: 'Session ID is required' });
      }

      const meals = await knex('meals')
        .where({ session_id: sessionId })
        .select()

      const formattedMeals = meals.map((meal) => ({
        ...meal,
        in_diet: Boolean(meal.in_diet), // Converte para booleano
      }));

      // console.log(formattedMeals)

      return res.status(200).send({ meals: formattedMeals })

    } catch (error) {
      console.error('Error fetching meals:', error);


      return res.status(500).send({ error: 'Internal Server Error' })
    }

  })

  // get 'meals/:id'
  app.get('/meals/:id', async (req, res) => {
    try {
      const getMealParamsSchema = z.object({
        id: z.string().uuid()
      })

      const { id } = getMealParamsSchema.parse(req.params)

      const sessionId = req.cookies.sessionId;

      const meal = await knex('meals')
        .where({ id })
        .andWhere({ session_id: sessionId })
        .first()

      if (!meal?.id) {
        return res.status(404).send({ error: 'Meal not found' });
      }

      const formattedMeal = {
        ...meal,
        in_diet: Boolean(meal.in_diet), // Converte para booleano
      };

      // console.log(formattedMeal)
      return res.status(200).send({ meal: formattedMeal })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(404).send({
          error: 'Meal Not Found',
          details: error.errors
        })
      }
    }
  })

  // patch '/:id'
  app.patch('/meals/:id', async (req, res) => {
    try {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const updateMealBodySchema = z.object({
        name: z.string().min(5, 'Name must be at least 5 characteres long').optional(),
        description: z.string().optional(),
        in_diet: z.boolean().optional()
      })

      const { id } = getMealParamsSchema.parse(req.params)

      const { name, description, in_diet } = updateMealBodySchema.parse(req.body)

      const sessionId = req.cookies.sessionId;

      const meal = await knex('meals')
        .where({ id })
        .andWhere({ session_id: sessionId })
        .first();

      if (!meal) {
        return res.status(404).send({ error: 'Meal not found' });
      }

      if (!sessionId) {
        return res.status(400).send({ error: 'Session ID is required' });
      }

      if (meal.in_diet !== in_diet) {
        await updateMealsInDiet(sessionId, meal.in_diet, false)
        await updateMealsInDiet(sessionId, meal.in_diet, true)
      }

      await knex('meals')
        .where({ id })
        .update({ name, description, in_diet })

      await updateSequenceOfMealsInDiet(sessionId)

      return res.status(200).send()
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).send({
          error: 'Validation error',
          details: error.errors
        })
      }
    }

  })

  // delete '/:id'
  app.delete('/meals/:id', async (req, res) => {
    try {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const sessionId = req.cookies.sessionId;

      if (!sessionId) {
        return res.status(401).send({ error: 'Unauthorized: Session ID is required!' });
      }

      const { id } = getMealParamsSchema.parse(req.params)


      const meal = await knex('meals')
        .where({ id })
        .andWhere({ session_id: sessionId })
        .first();

      if (!meal) {
        return res.status(404).send({ error: 'Meal not found' });
      }

      await knex('meals').where({ id }).delete()

      await updateTotalMeals(sessionId, false)
      await updateMealsInDiet(sessionId, meal.in_diet, false)
      await updateSequenceOfMealsInDiet(sessionId)

      return res.status(204).send()

    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(500).send({
          error: 'Internal Server Error',
          details: error.errors
        })
      }
    }
  })
}