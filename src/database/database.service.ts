import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {ConfigService} from "@nestjs/config";
import pg from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy, OnModuleDestroy {

    private readonly logger = new Logger(DatabaseService.name);
    private readonly pool: pg.Pool;

    constructor(private readonly config: ConfigService) {
        this.pool = new pg.Pool({
            connectionString: this.config.getOrThrow<string>('DATABASE_URL'),
        });

        this.pool.on('error', (err) => {
            this.logger.error(`Pool error: ${err.message}`);
        });
    }

    async onModuleInit() {
        const { rows } = await this.pool.query(`SELECT NOW()`);

        this.logger.log(`Connected to Neon. Server time: ${rows[0].now}`,);
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    query(text: string, params?: unknown[]) {
        return this.pool.query(text,params);
    }

}
