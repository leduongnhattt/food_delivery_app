import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, createAccountForEnterprise } from '@/services/auth.service'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
    const auth = requireAdmin(request)
    if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const search = (searchParams.get('search') || '').trim()
    const where: any = {}
    if (status === 'active') where.account = { is: { Status: 'Active' } }
    if (status === 'locked') where.account = { is: { Status: 'Inactive' } }
    if (search) {
        where.OR = [
            { EnterpriseName: { contains: search, mode: 'insensitive' } },
            { PhoneNumber: { contains: search, mode: 'insensitive' } },
            { account: { is: { Email: { contains: search, mode: 'insensitive' } } } },
        ]
    }
    const items = await prisma.enterprise.findMany({
        where,
        orderBy: { CreatedAt: 'desc' },
        select: {
            EnterpriseID: true,
            EnterpriseName: true,
            PhoneNumber: true,
            Address: true,
            OpenHours: true,
            CloseHours: true,
            CreatedAt: true,
            account: { select: { AccountID: true, Email: true, Status: true } }
        }
    })
    return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
    const auth = requireAdmin(request)
    if (!auth.success) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    try {
        const body = await request.json()
        const {
            username, email, password,
            enterpriseName, phoneNumber, address,
            openHours, closeHours, description
        } = body

        if (!username || !email || !password || !enterpriseName || !phoneNumber || !address || !openHours || !closeHours) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const passwordHash = await hashPassword(password)
        const created = await createAccountForEnterprise({
            username, email, passwordHash,
            enterpriseName, address, phoneNumber,
            description, openHours, closeHours
        })
        return NextResponse.json({ success: true, enterprise: created.enterprise })
    } catch (error) {
        console.error('Failed to create enterprise', error)
        return NextResponse.json({ error: 'Failed to create enterprise' }, { status: 500 })
    }
}




