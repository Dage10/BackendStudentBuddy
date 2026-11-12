import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request } from 'express';

const LOGGED = [401, 403, 429];

@Catch(HttpException)
export class SecurityLogFilter extends BaseExceptionFilter {
    private readonly logger = new Logger('Security');

    catch(exception: HttpException, host: ArgumentsHost) {
        const status = exception.getStatus();
        if(LOGGED.includes(status)) {
            const { method, path } = host.switchToHttp().getRequest<Request>();
            this.logger.warn(`${status} ${method} ${path}`);
        }
        super.catch(exception, host);
    }
}