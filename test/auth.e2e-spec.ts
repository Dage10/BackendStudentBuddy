import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { client, closeApp, createApp, signup } from './app.js';

let app: NestExpressApplication;
beforeAll(async () => { app = await createApp(); });
afterAll(() => closeApp(app));

describe('registration and login', () => {
    it('registers without returning the hash', async () => {
        const id = randomUUID().slice(0, 8);
        const { body } = await client(app)
            .post('/auth/register')
            .send({ username: `t_${id}`, email: `t_${id}@test.dev`, password: 'correct-horse-123'})
            .expect(201);
        expect(Object.keys(body).sort()).toEqual(['id', 'username']);
        expect(JSON.stringify(body)).not.toMatch(/argon2|password/i);
    });

    it('rejects a duplicate username or email', async () => {
       const { username, email, password } = await signup(app);
       await client(app).post('/auth/register').send({ username, email, password }).expect(409);
    });

    it('login returns only the token', async () => {
       const user = await signup(app);
       const { body } = await client(app)
           .post('/auth/login')
           .send({ username: user.username, password: user.password })
           .expect(200);
       expect(Object.keys(body)).toEqual(['accessToken']);
    });

    it('wrong password and unknown user return the same error', async () => {
       const user = await signup(app);
       const wrong = await client(app).post('/auth/login').send({ username: user.username, password: 'wrong-password' });
       const unknown = await client(app).post('/auth/login').send({ username: 't_nobody0', password: 'wrong-password' });
       expect(wrong.status).toBe(401);
       expect(unknown.status).toBe(401);
       expect(unknown.body).toEqual(wrong.body);
    });

    it.each([
        ['a short password', { password: 'short' }],
        ['an invalid email', { email: 'not-an-email' }],
        ['a username with symbols', { username: 'bad user!' }],
        ['an unexpected field', { isAdmin: true }],
    ])('rejects registration with %s', async (_, override) => {
       const base = { username: 't_valid01', email: 't_valid01@test.dev', password: 'correct-horse-123' };
       await client(app).post('/auth/register').send({ ...base, ...override }).expect(400);
    });
});

describe('protected route', () => {
   const sign = (secret: string, expiresIn: number) =>
       jwt.sign({}, secret, { algorithm: 'HS256', subject: randomUUID(), expiresIn });
   it('rejects a request without a token', async () => {
      await client(app).get('/study').expect(401);
   });

   it.each([
       ['malformed', () => 'not-a-jwt'],
       ['expired', () => sign(process.env.JWT_SECRET!, -10)],
       ['wrongly signed', () => sign('x'.repeat(32), 60)],
   ])('rejects a %s token', async (_,token) => {
      await client(app, token()).get('/study').expect(401);
   });
});