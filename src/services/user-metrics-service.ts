import { knex } from "../database";

export const updateTotalMeals = async (sessionId: string, increment: boolean) => {
  const user = await knex('users').where('session_id', sessionId).first()

  if (!user) throw new Error('User not found')

  const metrics = typeof user.metrics === 'string'
    ? JSON.parse(user.metrics)
    : user.metrics

  metrics.totalMeals += increment ? 1 : -1;

  await knex('users')
    .where('session_id', sessionId)
    .update({ metrics: JSON.stringify(metrics) })
}