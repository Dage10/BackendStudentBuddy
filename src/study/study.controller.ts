import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard, type AuthRequest } from '../auth/auth.guard.js';
import { StudyService } from './study.service.js';
import { studySchema, type StudyDto } from './study.schemas.js';

@Controller('study')
@UseGuards(AuthGuard)
export class StudyController {
    constructor(private readonly study: StudyService) {}

    @Get()
    list(@Req() req: AuthRequest) {
        return this.study.list(req.userId);
    }

    @Get(':id')
    get(@Req() req: AuthRequest, @Param('id', new ParseUUIDPipe()) id: string) {
        return this.study.get(req.userId, id);
    }

    @Post()
    @Throttle({ default: { limit: 5, ttl: 60_000 } })
    create(@Req() req: AuthRequest, @Body({ schema: studySchema }) body: StudyDto){
        return this.study.create(req.userId, body.topic);
    }
}
