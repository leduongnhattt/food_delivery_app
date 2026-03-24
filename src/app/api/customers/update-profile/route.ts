import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        // Single source of truth for auth (supports Bearer or cookie internally)
        const auth = getAuthenticatedUser(request)
        if (!auth.success) {
            return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
        }
        const userId = auth.user!.id
        const body = await request.json()
        const { fullName, phone, address } = body as {
            fullName?: string
            phone?: string
            address?: string
        }

        const updated = await prisma.customer.update({
            where: { AccountID: userId },
            data: {
                FullName: fullName ?? undefined,
                PhoneNumber: phone ?? undefined,
                Address: address ?? undefined,
            },
            select: {
                CustomerID: true,
                AccountID: true,
                FullName: true,
                PhoneNumber: true,
                Address: true,
            }
        })

        return NextResponse.json({ customer: updated })
    } catch (error) {
        console.error('Update customer profile error:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}



