import { z } from 'zod';

export const answerSchema = z.strictObject({
    questionId: z.string().uuid(),
    answer: z.string().min(1).max(300),
});

export type AnswerDto = z.infer<typeof answerSchema>;