import { execSync } from "node:child_process";
import { beforeEach, describe } from "node:test";
import request from "supertest";
import { afterAll, beforeAll, expect, it } from "vitest";
import { app } from "../../src/app";
import { knex } from "../../src/database";

beforeAll(async () => {
  await knex('users').truncate()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

beforeEach(() => {
  execSync('npm run knex:rollback-all')
  execSync('npm run knex:migrate-run')

})

describe('Creates User', () => {
  it('should be able to create a user', async () => {
    const response = await request(app.server)
      .post('/user/create-user')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
      });

    // Verifica se o status HTTP é 201 (Created)
    expect(response.status).toBe(201);

    // Verifica se o usuário foi salvo no banco de dados
    const user = await knex('users').where({ email: 'johndoe@example.com' }).first();
    if (user) {

      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('johndoe@example.com');
    }
  })
  it('should not be able to create a user with invalid data', async () => {
    const response = await request(app.server)
      .post('/user/create-user')
      .send({
        name: 'John',
        email: 'invalid-email' // invalid
      })

    // Verifica se o status HTTP é 400
    expect(response.status).toBe(400)

    // Verifica se a mensagem de erro está presente
    expect(response.body).toHaveProperty('error', 'Validation error');
  })
  it('should not be able to create a user with duplicate email', async () => {
    await request(app.server)
      .post('/user/create-user')
      .send({
        name: 'John Doe',
        email: 'johndoe@example.com',
      });

    const response = await request(app.server)
      .post('/user/create-user')
      .send({
        name: 'Johnny Doe',
        email: 'johndoe@example.com',
      });


    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Email already in use')
  })
})