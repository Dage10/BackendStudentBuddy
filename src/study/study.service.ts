import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { GeminiService } from './gemini.service.js';

const GRADE = `count(*) FILTER (WHERE qr.is_correct)::int AS correct,
               count(*)::int AS total,
               count(qr.user_answer) < count(*) AS pending`

@Injectable()
export class StudyService {
    constructor(
        private readonly db: DatabaseService,
        private readonly gemini: GeminiService,
    ) {}

    async list(userId: string) {
        const { rows } = await this.db.query(
            `SELECT s.id, left(s.topic, 100) AS topic, s.created_at, ${GRADE}
                  FROM sessions s
                  JOIN quiz_results qr ON qr.session_id = s.id
                  WHERE s.user_id = $1
                  GROUP BY s.id
                  ORDER BY s.created_at DESC
                  LIMIT 50`,
            [userId]
        );
        return { sessions: rows };
    }

    async get(userId: string, sessionId: string) {
        const { rows } = await this.db.query(
            `SELECT s.id, s.topic, s.explanation, s.created_at, ${GRADE}
                  FROM sessions s
                  JOIN quiz_results qr ON qr.session_id = s.id
                  WHERE s.id = $1 AND s.user_id = $2
                  GROUP BY s.id`,
                  [sessionId, userId],
        );
        if (!rows[0]) {
            throw new NotFoundException('Session not found');
        }
        return rows[0];
    }

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
