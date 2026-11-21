import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  const server = app.getHttpServer();
  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
