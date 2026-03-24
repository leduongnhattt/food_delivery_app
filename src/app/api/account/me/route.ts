import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const auth = getAuthenticatedUser(request)
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const account = await prisma.account.findUnique({
            where: { AccountID: auth.user.id },
            select: { Avatar: true }
        })

        return NextResponse.json({ avatar: account?.Avatar || '' })
    } catch (error) {
        console.error('Failed to fetch account', error)
        return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
    }
}


