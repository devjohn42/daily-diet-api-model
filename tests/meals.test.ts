import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { knex } from '../src/database'

beforeAll(async () => {
  await knex('meals').truncate()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('Meals Routes', () => {
  // POST '/create-meal'
  describe('Create a new meal tests', () => {
    it.todo('User can register a new meal', async () => { })
  })

  // GET '/list-meals'
  describe('Get meals list tests', () => {
    it.todo('User can get the meals list', async () => { })
  })

  // GET '/:id'
  describe('Get meal by id tests', () => {
    it.todo('User can get the meal by id', async () => { })
  })

  // PATCH '/:id'
  describe('Update meal by id tests', () => {
    it.todo('User can update the meal by id', async () => { })
  })

  // DELETE '/:id'
  describe('Delte meal by id tests', () => {
    it.todo('User can delete the meal by id', async () => { })
  })
})