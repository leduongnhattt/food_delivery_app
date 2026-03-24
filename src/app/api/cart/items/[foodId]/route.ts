import { NextRequest, NextResponse } from 'next/server'
import { resolveActiveCartId, setCartItemQty, snapshotCart } from '../../_service/cart.server'
import { ONE_DAY_SECONDS } from '@/lib/cart-keys'
import { verifyTokenEdgeSync } from '@/lib/auth-edge'

function getActor(req: NextRequest): { userId?: string, guestToken?: string } {
    let userId = req.headers.get('x-user-id') || undefined
    if (!userId) {
        const authHeader = req.headers.get('authorization')
        const bearer = authHeader?.replace('Bearer ', '')
        if (bearer) {
            const decoded = verifyTokenEdgeSync(bearer)
            if (decoded?.accountId && decoded.role?.toLowerCase() === 'customer') {
                userId = decoded.accountId
            }
        }
    }
    const guestToken = req.cookies.get('guest_token')?.value || undefined
    return { userId, guestToken }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ foodId: string }> }) {
    try {
        const actor = getActor(req)
        const { foodId } = await ctx.params
        const body = await req.json()
        const qty: number = Number(body.quantity)
        if (!foodId || Number.isNaN(qty)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

        const cartId = await resolveActiveCartId(actor)
        if (!cartId) return NextResponse.json({ error: 'Cart not found' }, { status: 404 })

        await setCartItemQty(cartId, foodId, qty, actor.guestToken ? ONE_DAY_SECONDS : undefined)
        const snap = await snapshotCart(cartId)
        return NextResponse.json(snap)
    } catch (e) {
        console.error('PATCH /api/cart/items/[foodId] failed', e)
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
    }
}


