import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary()
    table.text('name').notNullable()
    table.text('email').notNullable().unique()
    table.json('metrics').notNullable().defaultTo(JSON.stringify({
      totalMeals: 0,
      totalMealsInDiet: 0,
      totalMealsOutDiet: 0,
      sequenceOfMealsInTheDiet: 0
    }))
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}

