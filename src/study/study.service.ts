import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { GeminiService } from './gemini.service.js';

@Injectable()
export class StudyService {
    constructor(
        private readonly db: DatabaseService,
        private readonly gemini: GeminiService,
    ) {}

    async create(userId: string, topic: string) {
        const { explanation, questions } = await this.gemini.generateQuiz(topic);
        const toSave = questions.map(({ question, options, correctIndex })=> ({
            question,
            options,
            correctAnswer: options[correctIndex],
        }));
        const { rows } = await this.db.query(
            `WITH s AS (
                     INSERT INTO sessions (user_id, topic, explanation)
                     VALUES ($1, $2, $3)
                     RETURNING id
            )         
            INSERT INTO quiz_results (session_id, position, question, options, correct_answer)
            SELECT s.id, q.ord - 1, q.value->>'question', q.value->'options', q.value->>'correctAnswer'
            FROM s, jsonb_array_elements($4::jsonb) WITH ORDINALITY AS q(value, ord)
            RETURNING session_id, id, position, question, options`,
            [userId, topic, explanation, JSON.stringify(toSave)],
        );
        return {
            sessionId: rows[0].session_id,
            explanation,
            questions: rows.map(({ id, position, question, options }) =>
                ({ id, position, question, options })),
        };
    }
}
