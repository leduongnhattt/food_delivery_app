import { NextRequest, NextResponse } from 'next/server'
import { findAccountByUsername, verifyPassword, issueTokens } from '@/services/auth.service'
import { prisma } from '@/lib/db'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'

function setRefreshCookie(res: NextResponse, token: string, expires: Date) {
    res.cookies.set('refresh_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        expires
    })
}

export const POST = withRateLimit(async (request: NextRequest) => {
    try {
        const body = await request.json()
        const { username, password } = body

        // Validate required fields
        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            )
        }

        // Find account by username
        const account = await findAccountByUsername(username)

        if (!account) {
            return NextResponse.json(
                { error: 'Username does not exist. Please check your username or create a new account.' },
                { status: 401 }
            )
        }

        // Check password
        const isPasswordValid = await verifyPassword(password, account.PasswordHash)

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Incorrect password. Please check your password and try again.' },
                { status: 401 }
            )
        }

        // Ensure we have the latest role from DB
        const roleRecord = await prisma.account.findUnique({
            where: { AccountID: account.AccountID },
            select: { role: { select: { RoleName: true } } }
        })
        const roleName = roleRecord?.role?.RoleName || account.role?.RoleName || 'Customer'

        // Block login for locked Customer/Enterprise accounts
        const roleLower = (roleName || '').toLowerCase()
        if ((roleLower === 'customer' || roleLower === 'enterprise') && account.Status === 'Inactive') {
            return NextResponse.json(
                { error: 'Your account is locked. Please contact support.' },
                { status: 403 }
            )
        }

        // Issue tokens
        const { accessToken, refreshToken, expiredAt } = await issueTokens(
            account.AccountID,
            roleName,
            'email' // Provider for email/password login
        )

        // Create response
        const response = NextResponse.json({
            success: true,
            user: {
                id: account.AccountID,
                username: account.Username,
                email: account.Email,
                role: roleName,
                status: account.Status
            },
            accessToken
        })

        // Set refresh token cookie
        setRefreshCookie(response, refreshToken, expiredAt)

        return response
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        )
    }
}, (req) => ({
    key: `login:${getClientIp(req)}`,
    limit: 10,
    windowMs: 60 * 1000
}))
