import type { NestExpressApplication } from '@nestjs/platform-express';
import { CapturingLogger } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { client, closeApp, createApp, signup } from './app.js';

const logger = new CapturingLogger();
let app: NestExpressApplication;
beforeAll(async () => { app = await createApp(logger); });
afterAll(() => closeApp(app));
beforeEach(() => logger.clear());

const login = (password: string, c = client(app)) =>
    c.post('/auth/login').send({ username: 't_nobody0', password });

describe('security logs', () => {
   it('logs a 401 with method and path, without password or token', async () => {
      await login('secret-password-123').expect(401);
      await client(app, 'leak-token-xyz').get('/study').expect(401);

      logger.assertLogged({ level: 'warn', context: 'Security', message: '401 POST /auth/login' });
      logger.assertLogged({ level: 'warn', context: 'Security', message: '401 GET /study' });
      logger.assertNotLogged((e) => /secret-password-123|leak-token-xyz/.test(JSON.stringify([e.message, e.params])));
   });

   it('logs a 403', async () => {
      const { token } = await signup(app);
      await client(app, token).delete('/auth/me').send({ password: 'wrong-password' }).expect(403);

      logger.assertLogged({ level: 'warn', context: 'Security', message: '403 DELETE /auth/me' });
   });

   it('returns 429 after 10 failed logins in one minute and logs it', async () => {
      const attacker = client(app);
      for (let i = 0; i < 10; i++) await login('wrong-password', attacker).expect(401);
      await login('wrong-password', attacker).expect(429);

      logger.assertLogged({ level: 'warn', context: 'Security', message: '429 POST /auth/login' });
   });
});