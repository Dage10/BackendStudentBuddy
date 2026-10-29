import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { BadRequestException, StandardSchemaValidationPipe} from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new StandardSchemaValidationPipe({
      exceptionFactory: () => new BadRequestException('Invalid Input'),
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
