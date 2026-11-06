import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class QuizService {
    constructor(private readonly db: DatabaseService) {}

    async getQuiz(userId: string, sessionId: string) {

        const { rows } = await this.db.query(
            `SELECT qr.id, qr.position, qr.question, qr.options,
                  CASE WHEN qr.user_answer IS NOT NULL THEN qr.correct_answer ELSE NULL END AS correct_answer,
                  qr.user_answer, qr.is_correct
                  FROM quiz_results qr
                  JOIN sessions s ON s.id = qr.session_id
                  WHERE qr.session_id = $1 AND s.user_id = $2
                  ORDER BY qr.position ASC`,
            [sessionId, userId]
        );

        if(rows.length === 0){
            throw new NotFoundException('Quiz not found');
        }

        return { questions: rows };
    }

    async answerQuestion(userId: string, sessionId: string, questionId: string, answer: string) {
        const { rows } = await this.db.query(
            `SELECT qr.options
                  FROM quiz_results qr
                  JOIN sessions s ON s.id = qr.session_id
                  WHERE qr.id = $1 AND qr.session_id = $2 AND s.user_id = $3`,
            [questionId, sessionId, userId]
        );

        if(rows.length === 0) {
            throw new NotFoundException('Question or session not found');
        }

        if (!rows[0].options.includes(answer)) {
            throw new BadRequestException('Invalid option');
        }

        const { rows: updated } = await this.db.query(
            `UPDATE quiz_results
                  SET user_answer = $1, is_correct = (correct_answer = $1)
                  WHERE id = $2 AND user_answer IS NULL
                  RETURNING is_correct, correct_answer`,
            [answer, questionId]
        );

        if(updated.length === 0) {
            throw new BadRequestException('Question already answered');
        }

        return { isCorrect: updated[0].is_correct, correctAnswer: updated[0].correct_answer };
    }
}
