import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { BadRequestException, StandardSchemaValidationPipe} from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.useBodyParser('json', { limit: '16kb' });

  const proxyHops = Number(process.env.TRUST_PROXY);
  if (proxyHops) app.set('trust proxy', proxyHops);

  app.useGlobalPipes(new StandardSchemaValidationPipe({
      exceptionFactory: () => new BadRequestException('Invalid Input'),
    }),
  );

  const server = app.getHttpServer();
  server.headersTimeout = 10_000;
  server.requestTimeout = 15_000;

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
