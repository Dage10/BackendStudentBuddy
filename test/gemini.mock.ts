import { vi } from 'vitest';

const mocks = vi.hoisted(() => ({ generate: vi.fn() }));
export const generate = mocks.generate;

vi.mock('@google/genai', () => ({
    GoogleGenAI: class {
        interactions = { create: generate };
    }
}));

export const quiz = {
    explanation: 'Plants turn light into energy.',
    questions: Array.from({ length: 5 }, (_, i) => ({
        question: `Question ${i + 1}?`,
        options: ['a','b','c','d'],
        correctIndex: 1,
    })),
}

export const geminiReturns = (output: unknown) =>
    generate.mockResolvedValue({
       output_text: typeof output === 'string' ? output : JSON.stringify(output),
    });