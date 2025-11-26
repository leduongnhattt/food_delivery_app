import { NextRequest, NextResponse } from 'next/server'
import { resolveActiveCartId, createActiveCart, upsertCartItem, snapshotCart } from '../_service/cart.server'
import { prisma } from '@/lib/db'
import { ONE_DAY_SECONDS } from '@/lib/cart-keys'
import { verifyTokenEdgeSync } from '@/lib/auth-edge'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'

function getActor(req: NextRequest): { userId?: string, guestToken?: string } {
    let userId = req.headers.get('x-user-id') || undefined
    const authHeader = req.headers.get('authorization')
    if (!userId) {
        const bearer = authHeader?.replace('Bearer ', '')
        if (bearer) {
            const decoded = verifyTokenEdgeSync(bearer)
            if (decoded?.accountId && decoded.role?.toLowerCase() === 'customer') {
                userId = decoded.accountId
            }
            console.debug('cart/items.getActor decoded', {
                hasBearer: !!bearer,
                hasDecoded: !!decoded,
                role: decoded?.role,
                accountIdPresent: !!decoded?.accountId,
                resolvedUserId: !!userId,
            })
        }
    }
    // If user is authenticated, ignore any guest token to ensure CustomerID is used
    const cookieGuest = req.cookies.get('guest_token')?.value || undefined
    const guestToken = userId ? undefined : cookieGuest
    console.debug('cart/items.getActor result', {
        hasAuthHeader: !!authHeader,
        userIdPresent: !!userId,
        guestTokenPresent: !!guestToken,
        cookieGuestPresent: !!cookieGuest,
    })
    return { userId, guestToken }
}

export const POST = withRateLimit(async (req: NextRequest) => {
    try {
        const actor = getActor(req)
        console.debug('cart/items.POST actor', actor)
        const body = await req.json()
        const foodId: string = body.foodId
        const qty: number = Number(body.quantity || 1)
        const note: string | undefined = body.note
        if (!foodId || qty <= 0) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

        let cartId = await resolveActiveCartId(actor)
        if (!cartId) {
            // Optionally lock cart to one enterprise by reading Food.EnterpriseID
            const food = await prisma.food.findUnique({ where: { FoodID: foodId }, select: { EnterpriseID: true, Price: true } })
            if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 })
            cartId = await createActiveCart(actor, food.EnterpriseID)
            await upsertCartItem(cartId, foodId, qty, Number(food.Price), note, actor.guestToken ? ONE_DAY_SECONDS : undefined)
        } else {
            const food = await prisma.food.findUnique({ where: { FoodID: foodId }, select: { EnterpriseID: true, Price: true } })
            if (!food) return NextResponse.json({ error: 'Food not found' }, { status: 404 })
            // Optionally enforce one-enterprise policy here if needed by comparing with cart.EnterpriseID (omitted for brevity)
            await upsertCartItem(cartId, foodId, qty, Number(food.Price), note, actor.guestToken ? ONE_DAY_SECONDS : undefined)
        }

        const snap = await snapshotCart(cartId)
        return NextResponse.json(snap)
    } catch (e) {
        console.error('POST /api/cart/items failed', e)
        return NextResponse.json({ error: 'Failed to add item' }, { status: 500 })
    }
}, (req) => ({ key: `cart_items:${getClientIp(req)}`, limit: 60, windowMs: 60 * 1000 }))


