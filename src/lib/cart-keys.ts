export function cartByIdKey(cartId: string): string {
    return `cart:by-id:${cartId}`
}

export function cartItemsKey(cartId: string): string {
    return `cart:items:${cartId}`
}

export function cartIdByUserKey(userId: string): string {
    return `cart:id:by-user:${userId}`
}

export function cartIdByGuestKey(guestToken: string): string {
    return `cart:id:by-guest:${guestToken}`
}

export const ONE_DAY_SECONDS = 60 * 60 * 24

