import { BadRequestException, StandardSchemaValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

export function configureApp(app: NestExpressApplication) {
    app.use(helmet());
    app.useBodyParser('json', { limit: '16kb' });

    const proxyHops = Number(process.env.TRUST_PROXY);
    if (proxyHops) app.set('trust proxy', proxyHops);

    app.useGlobalPipes(
        new StandardSchemaValidationPipe({
            exceptionFactory: () => new BadRequestException('Invalid Input'),
        }),
    );
}