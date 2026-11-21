import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { answer, client, closeApp, createApp, newSession, signup } from './app.js';

let app: NestExpressApplication;
let a: Awaited<ReturnType<typeof signup>>;
let b: Awaited<ReturnType<typeof signup>>;

beforeAll(async () => {
   app = await createApp();
   a = await signup(app);
   b = await signup(app);
});

afterAll(() => closeApp(app));

const getQuiz = (token: string, sessionId: string) => client(app, token).get(`/quiz/${sessionId}`);

describe('quiz', () => {
   it('does not reveal the correct answer of unanswered questions', async () => {
       const s = await newSession(app, a.token);
       const before = await getQuiz(a.token, s.sessionId).expect(200);
       expect(before.body.questions.every((q: any) => q.correct_answer == null)).toBe(true);

       const res = await answer(app, a.token, s.sessionId, { questionId: s.questions[0].id, answer: 'b' });
       expect(res.status).toBeLessThan(300);
       expect(res.body).toEqual({ isCorrect: true, correctAnswer: 'b' });

       const after = await getQuiz(a.token, s.sessionId).expect(200);
       const { questions } = after.body;
       expect(questions.find((q: any) => q.id === s.questions[0].id).correct_answer).toBe('b');
       const pending = questions.filter((q: any) => q.id !== s.questions[0].id);
       expect(pending.every((q: any) => q.correct_answer == null)).toBe(true);
   });

   it('does not allow answering the same question twice', async () => {
      const s  = await newSession(app, a.token);
      const questionId = s.questions[0].id;
      await answer(app, a.token, s.sessionId, { questionId, answer: 'b' });
      await answer(app, a.token, s.sessionId, { questionId, answer: 'a'}).expect(400);

      const { body } = await getQuiz(a.token, s.sessionId).expect(200);
      expect(body.questions.find((q: any) => q.id === questionId).user_answer).toBe('b');
   });

   it('user B cannot view or answer the quiz of user A', async () => {
      const s = await newSession(app, a.token);
      await getQuiz(b.token, s.sessionId).expect(404);
      await answer(app, b.token, s.sessionId, { questionId: s.questions[0].id, answer: 'b'}).expect(404);

      const { body } = await getQuiz(a.token, s.sessionId).expect(200);
      expect(body.questions.every((q: any) => q.user_answer == null)).toBe(true);
   });

   it.each([
       ['an unexpected field', (id: string) => ({ questionId: id, answer: 'b', isCorrect: true })],
       ['an invalid questionId', () => ({ questionId: 'not-a-uuid', answer: 'b' })],
       ['an option that does not exist', (id: string) => ({ questionId: id, answer: 'zzz' })],
       ['a missing answer', (id: string) => ({ questionId: id })],
   ])('rejects an answer with %s', async (_, body) => {
       const s = await newSession(app, a.token);
       await answer(app, a.token, s.sessionId, body(s.questions[0].id)).expect(400);
   });
});