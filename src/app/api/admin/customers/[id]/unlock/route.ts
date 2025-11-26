import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/admin/customers/[id]/unlock => set Account.Status = Active
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params
    const cust = await prisma.customer.findUnique({ where: { CustomerID: id }, select: { AccountID: true } })
    if (!cust) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.account.update({ where: { AccountID: cust.AccountID }, data: { Status: 'Active' } })
    return NextResponse.json({ success: true })
}





