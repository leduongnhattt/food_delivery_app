import { NextRequest, NextResponse } from 'next/server'
import { resolveActiveCartId, hydrateRedisFromDb, snapshotCart, abandonCart, mergeGuestCartIntoUserCart } from './_service/cart.server'
import { ONE_DAY_SECONDS } from '@/lib/cart-keys'
import { verifyTokenEdgeSync } from '@/lib/auth-edge'

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
        }
    }
    // If user is authenticated, ignore any guest token to ensure separation from guest carts
    const cookieGuest = req.cookies.get('guest_token')?.value || undefined
    const guestToken = userId ? undefined : cookieGuest
    return { userId, guestToken }
}

export async function GET(req: NextRequest) {
    try {
        const actor = getActor(req)
        // If user is logged in and there is a guest cookie, perform a one-time merge
        if (actor.userId && req.cookies.get('guest_token')?.value) {
            const guestToken = req.cookies.get('guest_token')!.value
            await mergeGuestCartIntoUserCart(actor.userId, guestToken)
        }
        const cartId = await resolveActiveCartId(actor)
        if (!cartId) {
            // No cart yet; create for guest lazily on first GET only if explicitly requested? Here we keep null.
            return NextResponse.json({ cartId: null, items: [] })
        }
        // Ensure Redis has snapshot (hydrate if needed)
        await hydrateRedisFromDb(cartId, actor.guestToken ? ONE_DAY_SECONDS : undefined)
        const snap = await snapshotCart(cartId)
        return NextResponse.json(snap)
    } catch (e) {
        console.error('GET /api/cart failed', e)
        return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const actor = getActor(req)
        const cartId = await resolveActiveCartId(actor)
        if (!cartId) return new NextResponse(null, { status: 204 })
        await abandonCart(cartId)
        return new NextResponse(null, { status: 204 })
    } catch (e) {
        console.error('DELETE /api/cart failed', e)
        return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 })
    }
}


