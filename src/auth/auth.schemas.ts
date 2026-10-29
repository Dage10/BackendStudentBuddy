import { z } from 'zod';

const usernameSchema = z
    .string()
    .regex(/^[A-Za-z0-9_]{3,30}$/)
    .transform((username) => username.toLowerCase());

export const registerSchema = z.strictObject({
    username: usernameSchema,
    email: z.string().toLowerCase().pipe(z.email().max(254)),
    password: z.string().min(10).max(128),
});

export const loginSchema = z.strictObject({
    username: usernameSchema,
    password: z.string().min(1).max(128)
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
