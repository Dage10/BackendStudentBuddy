import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { client, closeApp, createApp, newSession, signup } from './app.js';
import { DatabaseService } from '../src/database/database.service.js';

let app: NestExpressApplication;
beforeAll(async () => { app = await createApp(); });
afterAll(() => closeApp(app));

describe('isolation between users', () => {
    it('B cannot see the session of A, neither in the detail nor in the history', async () => {
       const a = await signup(app);
       const b = await signup(app);
       const s = await newSession(app, a.token);

       await client(app, b.token).get(`/study/${s.sessionId}`).expect(404);
       const { body } = await client(app, b.token).get('/study').expect(200);
       expect(body.sessions).toEqual([]);
    });

    it('deleting the account of B does not touch the data of A', async () => {
        const a = await signup(app);
        const b = await signup(app);
        const s = await newSession(app, a.token);

        await client(app, b.token).delete('/auth/me').send({ password: b.password }).expect(204);
        await client(app, a.token).get(`/study/${s.sessionId}`).expect(200);

    });
});

describe('account deletion', () => {
   it('rejects a wrong password and deletes nothing', async () => {
      const a = await signup(app);
      await client(app, a.token).delete('/auth/me').send({ password: 'wrong-password' }).expect(403);
      await client(app).post('/auth/login').send({ username: a.username, password: a.password }).expect(200);
   });

   it('deletes the user, their sessions and their questions', async () => {
      const a = await signup(app);
      const s = await newSession(app, a.token);

      await client(app, a.token).delete('/auth/me').send({ password: a.password }).expect(204);

      const db = app.get(DatabaseService);
      const users = await db.query('SELECT 1 FROM users WHERE username = $1', [a.username]);
      const sessions = await db.query('SELECT 1 FROM sessions WHERE id = $1', [s.sessionId]);
      const questions = await db.query('SELECT 1 FROM quiz_results WHERE session_id = $1', [s.sessionId]);
      expect([users.rowCount, sessions.rowCount, questions.rowCount]).toEqual([0, 0, 0]);
      await client(app).post('/auth/login').send({ username: a.username, password: a.password }).expect(401);
   });
});