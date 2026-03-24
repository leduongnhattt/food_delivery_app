import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url)
        const accountId = searchParams.get('accountId')
        // role hint not required; middleware already protects API

        if (!accountId) {
            return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })
        }

        // Note: Authentication/authorization are handled in middleware.
        // This route simply returns customer data by AccountID (foreign key).

        const customer = await prisma.customer.findUnique({
            where: { AccountID: accountId },
            select: {
                CustomerID: true,
                AccountID: true,
                FullName: true,
                PhoneNumber: true,
                Address: true,
                DateOfBirth: true,
                Gender: true,
                PreferredPaymentMethod: true,
            },
        })

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        return NextResponse.json({ customer })
    } catch (error) {
        console.error('Get customer by account error:', error)
        return NextResponse.json({ error: 'Failed to get customer' }, { status: 500 })
    }
}


