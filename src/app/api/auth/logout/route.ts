import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
    try {
        const auth = getAuthenticatedUser(request)
        // Always clear cookie even if not authenticated
        const res = NextResponse.json({ success: true })
        res.cookies.set('refresh_token', '', {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            expires: new Date(0)
        })

        if (!auth.success) return res

        // Revoke all valid refresh tokens for this account
        await prisma.authToken.updateMany({
            where: { AccountID: auth.user!.id, IsValid: true },
            data: { IsValid: false, RevokedAt: new Date() }
        })

        return res
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json({ success: true })
    }
}

