import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getKeyJson, setKeyJson } from '@/lib/redis'

// GET /api/vouchers?code=OPTIONAL
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const code = searchParams.get('code')

        if (code) {
            const voucher = await prisma.voucher.findFirst({
                where: {
                    Code: code,
                    Status: 'Approved',
                    OR: [{ ExpiryDate: null }, { ExpiryDate: { gt: new Date() } }],
                },
                select: { Code: true, DiscountAmount: true, DiscountPercent: true, MinOrderValue: true },
            })
            if (!voucher) return NextResponse.json({ success: false, error: 'Invalid voucher' }, { status: 404 })
            return NextResponse.json({ success: true, voucher })
        }

        // Try Redis cache first
        const cacheKey = 'vouchers:approved:list'
        const cached = await getKeyJson<any[]>(cacheKey)
        let list = cached
        if (!list) {
            list = await prisma.voucher.findMany({
                where: { Status: 'Approved', OR: [{ ExpiryDate: null }, { ExpiryDate: { gt: new Date() } }] },
                orderBy: { CreatedAt: 'desc' },
                take: 50,
                select: { Code: true, DiscountAmount: true, DiscountPercent: true, MinOrderValue: true },
            })
            // Cache for 5 minutes
            await setKeyJson(cacheKey, list, 300)
        }
        return NextResponse.json({ success: true, vouchers: list })
    } catch (e) {
        console.error('Failed to fetch vouchers:', e)
        return NextResponse.json({ success: false, error: 'Failed to fetch vouchers' }, { status: 500 })
    }
}


