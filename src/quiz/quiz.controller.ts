import { Controller, Get, Post, Param, ParseUUIDPipe, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard, type AuthRequest } from '../auth/auth.guard.js';
import { QuizService } from './quiz.service.js';
import { answerSchema, type AnswerDto } from './quiz.schemas.js';

@Controller('quiz')
@UseGuards(AuthGuard)
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @Get(':sessionId')
    getQuiz(@Req() req: AuthRequest, @Param('sessionId', new ParseUUIDPipe()) sessionId: string) {
        return this.quizService.getQuiz(req.userId, sessionId);
    }

    @Post(':sessionId/answer')
    answerQuestion(
        @Req() req: AuthRequest,
        @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
        @Body({ schema: answerSchema }) body: AnswerDto,
    ) {
        return this.quizService.answerQuestion(req.userId, sessionId, body.questionId, body.answer);
    }
}
