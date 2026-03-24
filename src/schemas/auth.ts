import { z } from 'zod'

export const registerSchema = z.object({
    username: z.string().min(3).max(255),
    email: z.string().email().max(100),
    password: z.string().min(8).max(255),
    confirmPassword: z.string().min(8).max(255)
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
})

export const loginSchema = z.object({
    username: z.string().min(3).max(255),
    password: z.string().min(8).max(255)
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>


