import { Module } from '@nestjs/common';
import {ConfigModule} from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import {DatabaseModule} from "./database/database.module.js";
import {HealthModule} from "./health/health.module.js";
import { AuthModule } from './auth/auth.module.js'
import { StudyModule } from './study/study.module.js';

@Module({
  imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
      DatabaseModule,
      HealthModule,
      AuthModule,
      StudyModule
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
