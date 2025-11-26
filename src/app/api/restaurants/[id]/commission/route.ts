import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        const enterprise = await prisma.enterprise.findUnique({
            where: { EnterpriseID: id },
            select: { CommissionRate: true }
        })

        if (!enterprise) {
            return NextResponse.json({ success: false, error: 'Restaurant not found' }, { status: 404 })
        }

        const commissionFee = Number(enterprise.CommissionRate ?? 0)
        return NextResponse.json({ success: true, commissionFee })
    } catch (error) {
        console.error('Failed to load commission rate:', error)
        return NextResponse.json({ success: false, error: 'Failed to load commission' }, { status: 500 })
    }
}


