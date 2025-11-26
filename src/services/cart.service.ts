import { CartItemPayload, CartSnapshot } from "@/types/models"
import { buildHeaders, requestJson } from '@/lib/http-client'

// Debounce utility to prevent duplicate API calls
class DebouncedCartService {
    private fetchTimeout: NodeJS.Timeout | null = null
    private lastFetchPromise: Promise<CartSnapshot> | null = null
    private clearTimeout: NodeJS.Timeout | null = null
    private lastClearPromise: Promise<void> | null = null
    private updateTimeouts: Map<string, NodeJS.Timeout> = new Map()
    private lastUpdatePromises: Map<string, Promise<CartSnapshot>> = new Map()
    private readonly DEBOUNCE_DELAY = 0 // No debounce for immediate updates
    private isSilentMode = false // Silent mode for payment operations

    async fetchCart(): Promise<CartSnapshot> {
        // If in silent mode, return empty cart to avoid UI updates during payment
        if (this.isSilentMode) {
            return { cartId: null, items: [] }
        }

        // If there's already a pending request, return the same promise
        if (this.lastFetchPromise) {
            return this.lastFetchPromise
        }

        // Clear any existing timeout
        if (this.fetchTimeout) {
            clearTimeout(this.fetchTimeout)
        }

        // Create a new promise that will be resolved after debounce delay
        this.lastFetchPromise = new Promise((resolve, reject) => {
            this.fetchTimeout = setTimeout(async () => {
                try {
                    const result = await requestJson<CartSnapshot>('/api/cart', {
                        headers: buildHeaders(),
                    })
                    resolve(result)
                } catch (error) {
                    reject(error)
                } finally {
                    // Clear the promise reference after completion
                    this.lastFetchPromise = null
                }
            }, this.DEBOUNCE_DELAY)
        })

        return this.lastFetchPromise
    }

    // Force immediate fetch (bypass debounce)
    async fetchCartImmediate(): Promise<CartSnapshot> {
        if (this.fetchTimeout) {
            clearTimeout(this.fetchTimeout)
        }
        this.lastFetchPromise = null

        return requestJson<CartSnapshot>('/api/cart', {
            headers: buildHeaders(),
        })
    }

    // Enable silent mode (for payment operations)
    enableSilentMode(): void {
        this.isSilentMode = true
    }

    // Disable silent mode
    disableSilentMode(): void {
        this.isSilentMode = false
    }

    // Debounced clear cart to prevent duplicate DELETE calls
    async clearCart(): Promise<void> {
        // If there's already a pending clear request, return the same promise
        if (this.lastClearPromise) {
            return this.lastClearPromise
        }

        // Clear any existing timeout
        if (this.clearTimeout) {
            clearTimeout(this.clearTimeout)
        }

        // Create a new promise that will be resolved after debounce delay
        this.lastClearPromise = new Promise((resolve, reject) => {
            this.clearTimeout = setTimeout(async () => {
                try {
                    await fetch('/api/cart', {
                        method: 'DELETE',
                        cache: 'no-store',
                        headers: buildHeaders(),
                    })
                    resolve()
                } catch (error) {
                    reject(error)
                } finally {
                    // Clear the promise reference after completion
                    this.lastClearPromise = null
                }
            }, this.DEBOUNCE_DELAY)
        })

        return this.lastClearPromise
    }

    // Update quantity with request queuing to prevent race conditions
    async updateItemQuantity(foodId: string, quantity: number): Promise<CartSnapshot> {
        // Cancel any pending request for this item to allow new requests
        if (this.lastUpdatePromises.has(foodId)) {
            // Don't wait, just cancel the previous request
            this.lastUpdatePromises.delete(foodId)
        }

        // Create immediate request without debounce
        const updatePromise = requestJson<CartSnapshot>(`/api/cart/items/${foodId}`, {
            method: 'PATCH',
            headers: buildHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ quantity }),
        }).finally(() => {
            // Clear the promise reference after completion
            this.lastUpdatePromises.delete(foodId)
        })

        this.lastUpdatePromises.set(foodId, updatePromise)
        return updatePromise
    }
}

// Create singleton instance
const debouncedCartService = new DebouncedCartService()

// Public API used by hooks/components
export async function fetchCart(): Promise<CartSnapshot> {
    return debouncedCartService.fetchCart()
}

export async function fetchCartImmediate(): Promise<CartSnapshot> {
    return debouncedCartService.fetchCartImmediate()
}

export function enableCartSilentMode(): void {
    debouncedCartService.enableSilentMode()
}

export function disableCartSilentMode(): void {
    debouncedCartService.disableSilentMode()
}

export async function addItemToCart(payload: CartItemPayload): Promise<CartSnapshot> {
    return requestJson<CartSnapshot>('/api/cart/items', {
        method: 'POST',
        headers: buildHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
    })
}

export async function updateItemQuantity(foodId: string, quantity: number): Promise<CartSnapshot> {
    return debouncedCartService.updateItemQuantity(foodId, quantity)
}

export async function clearCart(): Promise<void> {
    return debouncedCartService.clearCart()
}

