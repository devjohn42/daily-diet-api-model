import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { knex } from '../src/database'

beforeAll(async () => {
  await knex('users').truncate()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('User Routes', () => {
  // POST '/create-user'
  describe('Creates User', () => {
    it.todo('should be able to create a user', async () => { })
  })

  // GET '/list-users'
  describe('Get users list tests', () => {
    it.todo('should be able to get the users list', async () => { })
  })

  // GET '/:id'
  describe('Get user by id tests', () => {
    it.todo('should be able to get the user by id', async () => { })
  })
})
