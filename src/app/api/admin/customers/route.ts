import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/customers
// Query: status=all|active|locked, search, limit, cursor
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const statusParam = (searchParams.get('status') || 'all').toLowerCase()
    const search = searchParams.get('search')?.trim() || ''
    const take = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100)
    const cursor = searchParams.get('cursor') || undefined

    const where: any = {}

    // Filter by Account.Status via relation
    if (statusParam === 'active') {
        where.account = { is: { Status: 'Active' } }
    } else if (statusParam === 'locked') {
        where.account = { is: { Status: 'Inactive' } }
    }

    // Simple search across name, phone, email
    if (search) {
        where.OR = [
            { FullName: { contains: search, mode: 'insensitive' } },
            { PhoneNumber: { contains: search, mode: 'insensitive' } },
            { account: { is: { Email: { contains: search, mode: 'insensitive' } } } }
        ]
    }

    const customers = await prisma.customer.findMany({
        where,
        take: take + 1,
        ...(cursor ? { cursor: { CustomerID: cursor }, skip: 1 } : {}),
        orderBy: { account: { CreatedAt: 'desc' } },
        select: {
            CustomerID: true,
            FullName: true,
            PhoneNumber: true,
            account: { select: { AccountID: true, Email: true, Status: true, CreatedAt: true } }
        }
    })

    let nextCursor: string | null = null
    if (customers.length > take) {
        const next = customers.pop()!
        nextCursor = next.CustomerID
    }

    return NextResponse.json({ items: customers, nextCursor })
}





