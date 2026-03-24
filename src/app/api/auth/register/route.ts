import { NextRequest, NextResponse } from 'next/server'
import { registerSchema } from '@/schemas/auth'
import { createAccount, hashPassword } from '@/services/auth.service'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const json = await request.json()
        const parsed = registerSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json({
                error: 'signup.errors.validationFailed',
                details: parsed.error.flatten()
            }, { status: 400 })
        }

        const { username, email, password } = parsed.data

        // Validate password strength
        if (password.length < 6) {
            return NextResponse.json({
                error: 'Password must be at least 6 characters long.',
                field: 'password'
            }, { status: 400 })
        }

        // Check for at least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return NextResponse.json({
                error: 'Password must contain at least one special character.',
                field: 'password'
            }, { status: 400 })
        }

        // Check for at least one number
        if (!/\d/.test(password)) {
            return NextResponse.json({
                error: 'Password must contain at least one number.',
                field: 'password'
            }, { status: 400 })
        }

        // Check for at least one letter
        if (!/[a-zA-Z]/.test(password)) {
            return NextResponse.json({
                error: 'Password must contain at least one letter.',
                field: 'password'
            }, { status: 400 })
        }

        // Check if username already exists
        const existingUsername = await prisma.account.findFirst({
            where: { Username: username },
            select: { Username: true }
        })
        if (existingUsername) {
            return NextResponse.json({
                error: 'signup.errors.usernameExists',
                field: 'username'
            }, { status: 400 })
        }

        // Check if email already exists
        const existingEmail = await prisma.account.findFirst({
            where: { Email: email },
            select: { Email: true }
        })
        if (existingEmail) {
            return NextResponse.json({
                error: 'signup.errors.emailExists',
                field: 'email'
            }, { status: 400 })
        }

        // Hash password and create account with customer record
        const passwordHash = await hashPassword(password)
        const account = await createAccount({ username, email, passwordHash })

        return NextResponse.json({
            success: true,
            message: 'signup.success.welcomeMessage',
            account: {
                id: account.AccountID,
                username: account.Username,
                email: account.Email,
                role: account.role?.RoleName,
                status: account.Status,
                customer: account.customer
            }
        }, { status: 201 })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json({
            error: 'signup.errors.unexpectedError',
            message: error instanceof Error ? error.message : 'signup.errors.unexpectedError'
        }, { status: 500 })
    }
}
