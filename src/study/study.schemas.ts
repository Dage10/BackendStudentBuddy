import { z } from 'zod';

export const studySchema = z.strictObject({
    topic: z.string().trim().min(3).max(2000),
});

export const quizSchema = z.strictObject({
    explanation: z.string().min(1).max(4000),
    questions: z.array(z.strictObject({
        question: z.string().min(1).max(300),
        options: z.array(z.string().min(1).max(200)).length(4),
        correctIndex: z.number().int().min(0).max(3),
    })).length(5)
});

export type StudyDto = z.infer<typeof studySchema>;
export type Quiz = z.infer<typeof quizSchema>;