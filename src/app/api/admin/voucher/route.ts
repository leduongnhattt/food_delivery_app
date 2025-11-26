import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { invalidateApprovedVouchersCache } from '@/lib/redis'
import { requireAdmin } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
    const auth = requireAdmin(request)
    if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
        const body = await request.json()
        const { Code, ExpiryDate, DiscountPercent, DiscountAmount, MinOrderValue, MaxUsage } = body
        if (!Code || !ExpiryDate || (DiscountPercent == null && DiscountAmount == null)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        const voucher = await prisma.voucher.create({
            data: {
                Code: String(Code),
                ExpiryDate: new Date(ExpiryDate),
                DiscountPercent: DiscountPercent != null ? Number(DiscountPercent) : null,
                DiscountAmount: DiscountAmount != null ? Number(DiscountAmount) : null,
                MinOrderValue: MinOrderValue != null && `${MinOrderValue}` !== '' ? Number(MinOrderValue) : null,
                MaxUsage: MaxUsage != null && `${MaxUsage}` !== '' ? Number(MaxUsage) : null,
                CreatedBy: 'Admin',
                Status: 'Approved',
                AdminID: auth.user!.id
            }
        })
        // Creating as Approved should reflect immediately for customers
        await invalidateApprovedVouchersCache()
        return NextResponse.json({ success: true, voucher })
    } catch (error) {
        console.error('Failed to create voucher', error)
        return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 })
    }
}



