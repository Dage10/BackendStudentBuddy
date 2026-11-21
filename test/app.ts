import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { type CapturingLogger, Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DatabaseService } from '../src/database/database.service.js';
import { geminiReturns, quiz } from './gemini.mock.js';

export async function createApp(logger?: CapturingLogger) {
    const builder = Test.createTestingModule({ imports: [AppModule] });
    if (logger) builder.setLogger(logger);
    const moduleRef = await builder.compile();
    const app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
    return app;
}

export async function closeApp(app: NestExpressApplication) {
    await app.get(DatabaseService).query(`DELETE FROM users WHERE username LIKE 't\\_%'`);
    await app.close();
}

let n = 0;
export function client(app: NestExpressApplication, token?: string) {
    const http = request.agent(app.getHttpServer()).set('X-Forwarded-For', `10.0.${n >> 8}.${n++ & 255}`);
    return token ? http.set('Authorization', `Bearer ${token}`) : http;
}

export async function signup(app: NestExpressApplication) {
    const id = randomUUID().slice(0, 8);
    const user = { username: `t_${id}`, email: `t_${id}@test.dev`, password: 'correct-horse-123'};
    await client(app).post('/auth/register').send(user).expect(201);
    const { body } = await client(app)
        .post('/auth/login')
        .send({ username: user.username, password: user.password })
        .expect(200);
    return { ...user, token: body.accessToken as string };
}

type Created = { sessionId: string; questions: { id: string }[] };

export async function newSession(app: NestExpressApplication, token: string) {
    geminiReturns(quiz);
    const { body } = await client(app, token).post('/study').send({ topic: 'Photosynthesis'}).expect(201);
    return body as Created;
}

export const answer = (app: NestExpressApplication, token: string, sessionId: string, body: object) =>
    client(app, token).post(`/quiz/${sessionId}/answer`).send(body);