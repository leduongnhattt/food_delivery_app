import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { invalidateApprovedVouchersCache } from '@/lib/redis'
import { requireAdmin } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
    const auth = requireAdmin(request)
    if (!auth.success) {
        return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { Code, ExpiryDate, DiscountPercent, DiscountAmount, MinOrderValue, MaxUsage } = body
        if (!Code || !ExpiryDate || (DiscountPercent == null && DiscountAmount == null)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get admin ID from account ID
        const admin = await prisma.admin.findUnique({
            where: { AccountID: auth.user!.id },
            select: { AdminID: true }
        })

        if (!admin) {
            return NextResponse.json({
                error: 'Admin profile not found. Please contact system administrator to create your admin profile.'
            }, { status: 404 })
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
                AdminID: admin.AdminID
            }
        })


        // Creating as Approved should reflect immediately for customers
        await invalidateApprovedVouchersCache()
        return NextResponse.json({ success: true, voucher })
    } catch (error: any) {
        // Handle duplicate code error
        if (error.code === 'P2002' && error.meta?.target?.includes('Code')) {
            return NextResponse.json({
                error: 'Voucher code already exists. Please use a different code.'
            }, { status: 409 })
        }

        // Handle foreign key constraint error
        if (error.code === 'P2003') {
            return NextResponse.json({
                error: 'Invalid admin reference. Please contact system administrator.'
            }, { status: 400 })
        }

        return NextResponse.json({
            error: error.message || 'Failed to create voucher',
            details: error.code || 'Unknown error'
        }, { status: 500 })
    }
}



