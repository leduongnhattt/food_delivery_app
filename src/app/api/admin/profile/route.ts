import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const auth = getAuthenticatedUser(request)
        if (!auth.success || !auth.user || auth.user.role !== 'Admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const admin = await prisma.admin.findUnique({
            where: { AccountID: auth.user.id },
            select: {
                AdminID: true,
                account: {
                    select: {
                        Username: true,
                        Email: true,
                        Avatar: true
                    }
                }
            }
        })

        if (!admin) {
            return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
        }

        return NextResponse.json({
            username: admin.account.Username,
            email: admin.account.Email,
            avatar: admin.account.Avatar
        })
    } catch (error) {
        console.error('Failed to fetch admin profile', error)
        return NextResponse.json({ error: 'Failed to fetch admin profile' }, { status: 500 })
    }
}
