import { prisma } from '@/lib/db'
import { getAllHashJson, getKeyJson, setKeyJson, deleteKey, expireKey } from '@/lib/redis'
import { cartByIdKey, cartIdByGuestKey, cartIdByUserKey, cartItemsKey } from '@/lib/cart-keys'

type Actor = { userId?: string; guestToken?: string }

export type CartItemSnapshot = {
    foodId: string
    quantity: number
    priceSnapshot?: number
    note?: string
    menuItem?: {
        id: string
        name: string
        price: number
        image: string
        description?: string
        category?: string
        restaurantId: string
        restaurantName?: string
    }
}

export type CartSnapshot = {
    cartId: string | null
    items: CartItemSnapshot[]
}
async function getItemsFromRedis(cartId: string): Promise<CartItemSnapshot[]> {
    const key = cartItemsKey(cartId)
    const list = await getKeyJson<CartItemSnapshot[]>(key)
    if (Array.isArray(list)) return list
    // Backward-compat: if old hash exists, read and convert once
    const legacy = await getAllHashJson<CartItemSnapshot>(key)
    const items = Object.values(legacy)
    if (items.length > 0) {
        // Delete legacy hash key first, then set single JSON value
        await deleteKey(key)
        await setKeyJson(key, items)
    }
    return items
}

async function setItemsToRedis(cartId: string, items: CartItemSnapshot[], ttlSeconds?: number): Promise<void> {
    const key = cartItemsKey(cartId)
    await setKeyJson(key, items, ttlSeconds)
}


function isGuest(actor: Actor): boolean {
    return !!actor.guestToken && !actor.userId
}

async function getActiveCartFromDb(actor: Actor): Promise<{ CartID: string; ExpiresAt: Date | null } | null> {
    if (actor.userId) {
        const customer = await prisma.customer.findFirst({ where: { AccountID: actor.userId }, select: { CustomerID: true } })
        if (!customer) return null
        const cart = await prisma.cart.findFirst({
            where: {
                CustomerID: customer.CustomerID,
                Status: 'Active',
            },
            select: { CartID: true, ExpiresAt: true },
            orderBy: { CreatedAt: 'desc' },
        })
        return cart
    }
    if (actor.guestToken) {
        const cart = await prisma.cart.findFirst({
            where: {
                GuestToken: actor.guestToken,
                Status: 'Active',
            },
            select: { CartID: true, ExpiresAt: true },
            orderBy: { CreatedAt: 'desc' },
        })
        return cart
    }
    return null
}

async function setActorCartIdCache(actor: Actor, cartId: string, ttlSeconds?: number): Promise<void> {
    if (actor.userId) {
        await setKeyJson(cartIdByUserKey(actor.userId), { cartId })
    }
    if (actor.guestToken) {
        await setKeyJson(cartIdByGuestKey(actor.guestToken), { cartId }, ttlSeconds)
    }
}

async function clearActorCartIdCache(actor: Actor): Promise<void> {
    if (actor.userId) {
        await deleteKey(cartIdByUserKey(actor.userId))
    }
    if (actor.guestToken) {
        await deleteKey(cartIdByGuestKey(actor.guestToken))
    }
}

export async function resolveActiveCartId(actor: Actor): Promise<string | null> {
    // Try Redis mapping first
    if (actor.userId) {
        const cached = await getKeyJson<{ cartId: string }>(cartIdByUserKey(actor.userId))
        if (cached?.cartId) {
            const dbCart = await prisma.cart.findUnique({
                where: { CartID: cached.cartId },
                select: { CartID: true, Status: true, ExpiresAt: true },
            })
            if (dbCart && dbCart.Status === 'Active') {
                return dbCart.CartID
            }
            await clearActorCartIdCache(actor)
        }
    }
    if (actor.guestToken) {
        const cached = await getKeyJson<{ cartId: string }>(cartIdByGuestKey(actor.guestToken))
        if (cached?.cartId) {
            const dbCart = await prisma.cart.findUnique({
                where: { CartID: cached.cartId },
                select: { CartID: true, Status: true, ExpiresAt: true },
            })
            const isExpired = dbCart?.ExpiresAt ? dbCart.ExpiresAt.getTime() <= Date.now() : false
            if (dbCart && dbCart.Status === 'Active' && !isExpired) {
                return dbCart.CartID
            }
            if (dbCart && (dbCart.Status !== 'Active' || isExpired)) {
                await abandonCart(dbCart.CartID)
            }
            await clearActorCartIdCache(actor)
        }
    }

    // Fallback to DB
    const dbCart = await getActiveCartFromDb(actor)
    if (!dbCart) return null

    // Lazy expire: if guest and expired -> abandon
    if (isGuest(actor) && dbCart.ExpiresAt && dbCart.ExpiresAt.getTime() <= Date.now()) {
        await abandonCart(dbCart.CartID)
        return null
    }

    await setActorCartIdCache(actor, dbCart.CartID, isGuest(actor) ? 60 * 60 * 24 : undefined)
    return dbCart.CartID
}

export async function createActiveCart(actor: Actor, enterpriseId: string): Promise<string> {
    const data: any = {
        EnterpriseID: enterpriseId,
        Status: 'Active',
    }
    if (actor.userId) {
        const customer = await prisma.customer.findFirst({ where: { AccountID: actor.userId }, select: { CustomerID: true } })
        if (customer) data.CustomerID = customer.CustomerID
    }
    if (actor.guestToken) {
        // Reuse existing cart by guest token if present (unique constraint on GuestToken)
        const existingByToken = await prisma.cart.findFirst({
            where: { GuestToken: actor.guestToken },
            select: { CartID: true, Status: true }
        })
        if (existingByToken) {
            // Reactivate and reuse the cart
            const updated = await prisma.cart.update({
                where: { CartID: existingByToken.CartID },
                data: { Status: 'Active', EnterpriseID: enterpriseId, ExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
                select: { CartID: true }
            })
            await setActorCartIdCache(actor, updated.CartID, 60 * 60 * 24)
            return updated.CartID
        }
        data.GuestToken = actor.guestToken
        data.ExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    }

    const created = await prisma.cart.create({ data, select: { CartID: true } })
    await setActorCartIdCache(actor, created.CartID, isGuest(actor) ? 60 * 60 * 24 : undefined)
    return created.CartID
}

export async function upsertCartItem(
    cartId: string,
    foodId: string,
    quantityDelta: number,
    priceSnapshot: number,
    note?: string,
    ttlSeconds?: number,
): Promise<void> {
    // Upsert in DB
    const existing = await prisma.cartItem.findFirst({ where: { CartID: cartId, FoodID: foodId } })
    if (existing) {
        await prisma.cartItem.update({
            where: { CartItemID: existing.CartItemID },
            data: { Quantity: existing.Quantity + quantityDelta, Note: note, Price: priceSnapshot },
        })
    } else {
        await prisma.cartItem.create({
            data: {
                CartID: cartId,
                FoodID: foodId,
                Quantity: Math.max(1, quantityDelta),
                Note: note,
                Price: priceSnapshot,
            },
        })
    }

    // Load food metadata for richer snapshot in Redis
    const food = await prisma.food.findUnique({
        where: { FoodID: foodId },
        select: {
            FoodID: true,
            DishName: true,
            Price: true,
            ImageURL: true,
            Description: true,
            EnterpriseID: true,
            foodCategory: { select: { CategoryName: true } },
            enterprise: { select: { EnterpriseName: true } },
        }
    })
    const nextQty = existing ? existing.Quantity + quantityDelta : Math.max(1, quantityDelta)
    const menuItem = food ? {
        id: food.FoodID,
        name: food.DishName,
        price: Number(food.Price),
        image: food.ImageURL || '',
        description: food.Description || undefined,
        category: food.foodCategory?.CategoryName || undefined,
        restaurantId: food.EnterpriseID,
        restaurantName: food.enterprise?.EnterpriseName || undefined,
    } : undefined

    // Update Redis list (single JSON per cart)
    const items = await getItemsFromRedis(cartId)
    const idx = items.findIndex(i => i.foodId === foodId)
    const updated: CartItemSnapshot = { foodId, quantity: nextQty, priceSnapshot, note, menuItem }
    if (idx >= 0) items[idx] = updated
    else items.push(updated)
    await setItemsToRedis(cartId, items, ttlSeconds)
    if (ttlSeconds) {
        await expireKey(cartItemsKey(cartId), ttlSeconds)
        await expireKey(cartByIdKey(cartId), ttlSeconds)
    }
}

export async function setCartItemQty(cartId: string, foodId: string, quantity: number, ttlSeconds?: number): Promise<void> {
    if (quantity <= 0) {
        // Remove item
        const existing = await prisma.cartItem.findFirst({ where: { CartID: cartId, FoodID: foodId } })
        if (existing) {
            await prisma.cartItem.delete({ where: { CartItemID: existing.CartItemID } })
        }
        // Update Redis list
        const items = await getItemsFromRedis(cartId)
        const next = items.filter(i => i.foodId !== foodId)
        await setItemsToRedis(cartId, next, ttlSeconds)
        return
    }

    const existing = await prisma.cartItem.findFirst({ where: { CartID: cartId, FoodID: foodId } })
    if (existing) {
        await prisma.cartItem.update({ where: { CartItemID: existing.CartItemID }, data: { Quantity: quantity } })
        // Preserve menuItem if already stored; otherwise enrich now
        const food = await prisma.food.findUnique({
            where: { FoodID: foodId },
            select: {
                FoodID: true,
                DishName: true,
                Price: true,
                ImageURL: true,
                Description: true,
                EnterpriseID: true,
                foodCategory: { select: { CategoryName: true } },
                enterprise: { select: { EnterpriseName: true } },
            }
        })
        const menuItem = food ? {
            id: food.FoodID,
            name: food.DishName,
            price: Number(food.Price),
            image: food.ImageURL || '',
            description: food.Description || undefined,
            category: food.foodCategory?.CategoryName || undefined,
            restaurantId: food.EnterpriseID,
            restaurantName: food.enterprise?.EnterpriseName || undefined,
        } : undefined
        const items = await getItemsFromRedis(cartId)
        const idx = items.findIndex(i => i.foodId === foodId)
        const updated: CartItemSnapshot = {
            foodId,
            quantity,
            priceSnapshot: Number(existing.Price),
            note: existing.Note ?? undefined,
            menuItem,
        }
        if (idx >= 0) items[idx] = updated
        else items.push(updated)
        await setItemsToRedis(cartId, items, ttlSeconds)
    }
    if (ttlSeconds) {
        await expireKey(cartItemsKey(cartId), ttlSeconds)
        await expireKey(cartByIdKey(cartId), ttlSeconds)
    }
}

export async function hydrateRedisFromDb(cartId: string, ttlSeconds?: number): Promise<void> {
    const items = await prisma.cartItem.findMany({
        where: { CartID: cartId },
        select: { FoodID: true, Quantity: true, Price: true, Note: true },
    })

    // Fetch foods metadata in batch for enrichment
    const foodIds = items.map(i => i.FoodID)
    const foods = await prisma.food.findMany({
        where: { FoodID: { in: foodIds } },
        select: {
            FoodID: true,
            DishName: true,
            Price: true,
            ImageURL: true,
            Description: true,
            EnterpriseID: true,
            foodCategory: { select: { CategoryName: true } },
            enterprise: { select: { EnterpriseName: true } },
        }
    })
    const foodMap = new Map(foods.map(f => [f.FoodID, f]))

    const next: CartItemSnapshot[] = []
    for (const it of items) {
        const f = foodMap.get(it.FoodID)
        const menuItem = f ? {
            id: f.FoodID,
            name: f.DishName,
            price: Number(f.Price),
            image: f.ImageURL || '',
            description: f.Description || undefined,
            category: f.foodCategory?.CategoryName || undefined,
            restaurantId: f.EnterpriseID,
            restaurantName: f.enterprise?.EnterpriseName || undefined,
        } : undefined
        next.push({
            foodId: it.FoodID,
            quantity: it.Quantity,
            priceSnapshot: Number(it.Price),
            note: it.Note ?? undefined,
            menuItem,
        })
    }
    await setItemsToRedis(cartId, next, ttlSeconds)

    await setKeyJson(cartByIdKey(cartId), { cartId })
    if (ttlSeconds) {
        await expireKey(cartItemsKey(cartId), ttlSeconds)
        await expireKey(cartByIdKey(cartId), ttlSeconds)
    }
}

export async function snapshotCart(cartId: string): Promise<CartSnapshot> {
    const items = await getItemsFromRedis(cartId)
    return { cartId, items }
}

export async function abandonCart(cartId: string): Promise<void> {
    // Mark DB cart as Abandoned and delete items
    await prisma.$transaction([
        // Also clear GuestToken to avoid unique constraint conflicts when creating new cart for the same guest
        prisma.cart.update({ where: { CartID: cartId }, data: { Status: 'Abandoned', GuestToken: null } }),
        prisma.cartItem.deleteMany({ where: { CartID: cartId } }),
    ])
    // Clear Redis
    await deleteKey(cartItemsKey(cartId))
    await deleteKey(cartByIdKey(cartId))
}


/**
 * Merge a guest cart (identified by guestToken) into the logged-in user's cart (identified by userId).
 * Strategy:
 * - If no guest cart: no-op
 * - If user has no active cart: reassign guest cart to user and clear guest mapping; rehydrate to remove TTL
 * - If both exist: add guest items into user cart (sum quantities), then abandon guest cart and clear guest mapping
 * - One-enterprise policy: relies on DB constraints or later enforcement (kept as-is like existing add flow)
 */
export async function mergeGuestCartIntoUserCart(userId: string, guestToken: string): Promise<void> {
    if (!userId || !guestToken) return

    // Resolve carts independently
    const guestCartId = await resolveActiveCartId({ guestToken })
    if (!guestCartId) return

    const userCartId = await resolveActiveCartId({ userId })

    // Case 1: user has no cart -> reassign guest cart to user
    if (!userCartId) {
        // Attach Cart to user customer, clear GuestToken and expiry
        const customer = await prisma.customer.findFirst({ where: { AccountID: userId }, select: { CustomerID: true } })
        if (!customer) {
            // No customer for this account; leave as guest cart
            return
        }

        await prisma.cart.update({
            where: { CartID: guestCartId },
            data: {
                CustomerID: customer.CustomerID,
                GuestToken: null,
                ExpiresAt: null,
                Status: 'Active',
            },
        })

        // Update caches: map user -> cart, clear guest mapping; rehydrate to remove TTL
        await setActorCartIdCache({ userId }, guestCartId)
        await clearActorCartIdCache({ guestToken })
        await hydrateRedisFromDb(guestCartId)
        return
    }

    // Case 2: both carts exist -> merge items from guest into user
    // Ensure Redis has guest items snapshot
    await hydrateRedisFromDb(guestCartId)
    const guestItems = await getItemsFromRedis(guestCartId)

    for (const it of guestItems) {
        // Use priceSnapshot if present, otherwise current DB price will be read inside upsert (we still pass snapshot param)
        const priceSnapshot = typeof it.priceSnapshot === 'number' ? it.priceSnapshot : (it.menuItem?.price ?? 0)
        const quantityDelta = Math.max(1, Number(it.quantity) || 1)
        await upsertCartItem(userCartId, it.foodId, quantityDelta, priceSnapshot, it.note)
    }

    // Abandon guest cart and clear caches
    await abandonCart(guestCartId)
    await clearActorCartIdCache({ guestToken })

    // Final rehydrate user cart to ensure consolidated snapshot
    await hydrateRedisFromDb(userCartId)
}
