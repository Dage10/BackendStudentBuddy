import { Module } from '@nestjs/common';
import {ConfigModule} from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import {DatabaseModule} from "./database/database.module.js";
import {HealthModule} from "./health/health.module.js";
import { AuthModule } from './auth/auth.module.js'
import { StudyModule } from './study/study.module.js';
import { QuizModule } from './quiz/quiz.module.js';
import { SecurityLogFilter } from './common/security-log.filter.js';

@Module({
  imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
      DatabaseModule,
      HealthModule,
      AuthModule,
      StudyModule,
      QuizModule
  ],
  providers: [
      { provide: APP_GUARD, useClass: ThrottlerGuard },
      { provide: APP_FILTER, useClass: SecurityLogFilter },
  ],
})
export class AppModule {}
