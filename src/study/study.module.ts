import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { GeminiService } from './gemini.service.js';
import { StudyController } from './study.controller.js';
import { StudyService } from './study.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [StudyController],
  providers: [StudyService, GeminiService],
})
export class StudyModule {}
