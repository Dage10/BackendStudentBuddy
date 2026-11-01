import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard, type AuthRequest } from '../auth/auth.guard.js';
import { StudyService } from './study.service.js';
import { studySchema, type StudyDto } from './study.schemas.js';

@Controller('study')
@UseGuards(AuthGuard)
export class StudyController {
    constructor(private readonly study: StudyService) {}

    @Post()
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    create(@Req() req: AuthRequest, @Body({ schema: studySchema }) body: StudyDto){
        return this.study.create(req.userId, body.topic);
    }
}
