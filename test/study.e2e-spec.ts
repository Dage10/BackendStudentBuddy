import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { client, closeApp, createApp, signup } from './app.js';
import { geminiReturns, generate, quiz } from './gemini.mock.js';

let app: NestExpressApplication;
beforeAll(async () => { app = await createApp(); });
afterAll(() => closeApp(app));

const create = (token: string, body: object) => client(app, token).post('/study').send(body);

describe('Study', () => {
   it('creates the session without exposing the correct answers', async () => {
       geminiReturns(quiz);
       const { token } = await signup(app);
       const { body } = await create(token, { topic: 'Photosynthesis' }).expect(201);
       expect(body.questions).toHaveLength(5);
       expect(JSON.stringify(body)).not.toMatch(/correct/i);
   });

   it.each([
       ['too short', { topic: 'ab' }],
       ['too long', { topic: 'a'.repeat(2001) }],
       ['with an unexpected field', { topic: 'Photosynthesis', userId: 'x'}],
       ['of the wrong type', { topic: 123 }],
   ])('rejects a topic that is %s', async (_, body) => {
      const { token } = await signup(app);
      await create(token, body).expect(400);
      expect(generate).not.toHaveBeenCalled();
   });

   it('rejects an oversized body before processing it', async () => {
      const { token } = await signup(app);
      await create(token, { topic: 'a'.repeat(20_000 )}).expect(413);
   });

   it('limits creation to 5 per minute, since each one spends Gemini quota', async () => {
       geminiReturns(quiz);
       const { token } = await signup(app);
       const c = client(app, token);
       for (let i = 0; i < 5; i++) await c.post('/study').send({ topic: 'Photosynthesis' }).expect(201);
       await c.post('/study').send({ topic: 'Photosynthesis' }).expect(429);
   });

   it.each([
       ['is not JSON', 'not json'],
       ['has 0 questions', { explanation: 'x', questions: [] }],
       ['has extra fields', { ...quiz, injected: true}],
   ])('when the AI response %s: returns an error and saves nothing', async (_, output) =>{
      geminiReturns(output);
      const { token } = await signup(app);
      await create(token, { topic: 'Photosynthesis' }).expect(502);
      const { body } = await client(app, token).get('/study').expect(200);
      expect(body.sessions).toEqual([]);
   });
});