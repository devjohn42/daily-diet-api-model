import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { knex } from '../src/database';

beforeAll(async () => {
  await knex('users').truncate()
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(() => {
  execSync('npm run knex:rollback-all')
  execSync('npm run knex:migrate-run')

})

describe('Users API', () => {
  // Testes para POST /create-user
  describe('POST /create-user', () => {
    it('should be able to create a user', async () => {
      const response = await request(app.server)
        .post('/user/create-user')
        .send({
          name: 'John Doe',
          email: 'johndoe@example.com',
        });

      expect(response.status).toBe(201);

      const user = await knex('users').where({ email: 'johndoe@example.com' }).first();
      if (user) {
        expect(user).toBeDefined();
        expect(user.name).toBe('John Doe');
        expect(user.email).toBe('johndoe@example.com');
      }
    });

    it('should not be able to create a user with invalid data', async () => {
      const response = await request(app.server)
        .post('/user/create-user')
        .send({
          name: 'Jo',
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation error');
    });

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
          name: 'Jane Doe',
          email: 'johndoe@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Email already in use');
    });
  });

  // Testes para GET /list-users
  describe('GET /list-users', () => {
    it('should be able to get the users list', async () => {
      await knex('users').insert({
        id: randomUUID(),
        name: 'Mark Doe',
        email: 'markdoe@example.com',
        session_id: 'mark-session',
        metrics: JSON.stringify({
          totalMeals: 0,
          totalMealsInDiet: 0,
          totalMealsOutDiet: 0,
          sequenceOfMealsInTheDiet: 0,
        }),
      });

      const response = await request(app.server).get('/user/list-users');

      expect(response.status).toBe(200);
      expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should return an empty list if no users are found', async () => {
      const response = await request(app.server).get('/user/list-users');

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(0);
    });

    it('should return users with the correct structure', async () => {
      await knex('users').insert({
        id: randomUUID(),
        name: 'Andrew Doe',
        email: 'andrewdoe@example.com',
        session_id: 'andrew-session',
        metrics: JSON.stringify({
          totalMeals: 0,
          totalMealsInDiet: 0,
          totalMealsOutDiet: 0,
          sequenceOfMealsInTheDiet: 0,
        }),
      });

      const response = await request(app.server).get('/user/list-users');

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(1);
      expect(response.body.users[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.any(String),
          session_id: expect.any(String),
          metrics: expect.any(Object),
        })
      );
    });
  });

  // Testes para GET /users/:id
  describe('GET /users/:id', () => {
    it('should be able to get the user by id', async () => {
      const [user] = await knex('users').insert(
        {
          id: randomUUID(),
          name: 'John Doe',
          email: 'johndoe@example.com',
          session_id: 'john-session',
        },
        ['id']
      );

      const response = await request(app.server).get(`/user/users/${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe('John Doe');
      expect(response.body.user.email).toBe('johndoe@example.com');
    });

    it('should not be able to get the user with an invalid id', async () => {
      const response = await request(app.server).get('/user/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});