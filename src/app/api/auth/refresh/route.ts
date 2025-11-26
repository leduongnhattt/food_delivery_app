import { NextRequest, NextResponse } from 'next/server'
import { rotateAccessTokenFromRefresh } from '@/services/auth.service'
import { prisma } from '@/lib/db'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'

export const POST = withRateLimit(async (request: NextRequest) => {
    try {
        const refresh = request.cookies.get('refresh_token')?.value
        let accountId = request.headers.get('x-account-id') || ''
        if (!refresh) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // If accountId header missing, derive from refresh token in DB (for robustness when switching accounts)
        if (!accountId) {
            const token = await prisma.authToken.findFirst({ where: { RefreshToken: refresh, IsValid: true } })
            if (token) {
                accountId = token.AccountID
            }
        }

        if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const accessToken = await rotateAccessTokenFromRefresh(accountId, refresh)
        if (!accessToken) return NextResponse.json({ error: 'Invalid refresh' }, { status: 401 })

        return NextResponse.json({ accessToken }, { status: 200 })
    } catch {
        return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
    }
}, (req) => ({
    key: `refresh:${getClientIp(req)}:${req.headers.get('x-account-id') || ''}`,
    limit: 30,
    windowMs: 5 * 60 * 1000
}))



