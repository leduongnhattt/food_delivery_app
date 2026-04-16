"use client"
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { CartItem, MenuItem } from '@/types/models'
import { addItemToCart, updateItemQuantity, clearCart as apiClearCart, fetchCart, fetchCartImmediate } from '@/services/cart.service'
import { FoodService } from '@/services/food.service'
import { calculatePrice } from '@/lib/utils'

type CartContextType = {
    cartItems: CartItem[]
    isOpen: boolean
    activeRestaurantId: string | null
    addToCart: (menuItem: MenuItem, quantity?: number, specialInstructions?: string) => void
    updateQuantity: (menuItemId: string, quantity: number) => void
    removeFromCart: (menuItemId: string) => void
    clearCart: () => void
    getTotalItems: () => number
    getTotalAmount: () => number
    openCart: () => void
    closeCart: () => void
    resetAfterLogout: () => Promise<void>
}

const CartContext = React.createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cartItems, setCartItems] = React.useState<CartItem[]>([])
    const [isOpen, setIsOpen] = React.useState(false)
    const [activeRestaurantId, setActiveRestaurantId] = React.useState<string | null>(null)
    const isMounted = useRef(false)
    const isFetchingCart = useRef(false)

    // Helper function to safely fetch and update cart data
    const updateCartFromServer = useCallback(async (useImmediate = false) => {
        if (isFetchingCart.current) return
        isFetchingCart.current = true

        try {
            const snap = useImmediate ? await fetchCartImmediate() : await fetchCart()
            if (!snap || !Array.isArray(snap.items) || snap.items.length === 0) {
                setCartItems([])
                setActiveRestaurantId(null)
                return
            }

            const foodIds = snap.items.map(i => i.foodId)
            const foods = await FoodService.getFoodsByIds(foodIds)
            const menuItemsMap = new Map(foods.map(f => [f.id, f]))
            const items: CartItem[] = snap.items
                .map(i => {
                    const f = menuItemsMap.get(i.foodId)
                    if (!f) return null
                    return {
                        menuItem: {
                            id: f.id,
                            name: f.name,
                            description: f.description || '',
                            price: i.priceSnapshot ?? f.price,
                            image: f.imageUrl,
                            category: f.category || '',
                            isAvailable: true,
                            restaurantId: f.restaurantId,
                            restaurantName: f.restaurantName,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        },
                        quantity: i.quantity,
                        specialInstructions: i.note,
                    } as CartItem
                })
                .filter(Boolean) as CartItem[]
            setCartItems(items)
            if (items.length > 0) setActiveRestaurantId(items[0].menuItem.restaurantId)
        } catch (e) {
            console.error('Error updating cart from server:', e)
        } finally {
            isFetchingCart.current = false
        }
    }, [])

    // Load from server snapshot (Redis-backed) once
    useEffect(() => {
        (async () => {
            await updateCartFromServer(true) // Use immediate fetch for initial load
            isMounted.current = true
        })()
    }, [updateCartFromServer])

    // Remove localStorage persistence; server snapshot is the source of truth

    // Listen to cross-tab updates (storage event doesn't fire in the same tab)
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key !== 'cart') return
            try {
                if (typeof e.newValue === 'string') {
                    setCartItems(JSON.parse(e.newValue))
                }
            } catch { }
        }
        window.addEventListener('storage', onStorage)
        return () => {
            window.removeEventListener('storage', onStorage)
        }
    }, [])

    const addToCart = useCallback((menuItem: MenuItem, quantity: number = 1, specialInstructions?: string) => {
        // Do not optimistically update; rely on server snapshot (prevents UI if DB fails)
        addItemToCart({ foodId: menuItem.id, quantity, note: specialInstructions })
            .then(async () => {
                await updateCartFromServer() // Use debounced fetch
                setIsOpen(true)
            })
            .catch(() => { /* keep UI unchanged on failure */ })
    }, [updateCartFromServer])

    const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
        // Immediate optimistic update for instant UI feedback
        setCartItems(prev => prev.map(i => i.menuItem.id === menuItemId ? { ...i, quantity } : i))

        // Immediate API call with queuing to prevent race conditions
        updateItemQuantity(menuItemId, quantity)
            .then(async () => {
                // Re-hydrate from server to ensure snapshot consistency
                await updateCartFromServer()
            })
            .catch(() => {
                // Revert optimistic update on error
                updateCartFromServer()
            })
    }, [updateCartFromServer])

    const removeFromCart = useCallback((menuItemId: string) => {
        // Optimistic UI update
        setCartItems(prev => {
            const next = prev.filter(i => i.menuItem.id !== menuItemId)
            if (next.length === 0) setActiveRestaurantId(null)
            return next
        })
        // Tell server to delete (set quantity = 0), then rehydrate
        updateItemQuantity(menuItemId, 0)
            .then(async () => {
                await updateCartFromServer() // Use debounced fetch
            })
            .catch(() => { })
    }, [updateCartFromServer])

    const clearCart = useCallback(() => {
        setCartItems([])
        setActiveRestaurantId(null)
        apiClearCart()
            .then(async () => {
                await updateCartFromServer() // Use debounced fetch
            })
            .catch(() => { })
    }, [updateCartFromServer])

    // Helper to call on logout to fully resync UI
    const resetAfterLogout = useCallback(async () => {
        try {
            // Clear local auth and notify other tabs
            if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token')
                localStorage.setItem('auth_event', `logout:${Date.now()}`)
            }
        } catch { }
        // Reset local cart state immediately
        setCartItems([])
        setActiveRestaurantId(null)
        setIsOpen(false)
        // Re-fetch cart snapshot as guest
        await updateCartFromServer(true) // Use immediate fetch for logout
    }, [updateCartFromServer])

    // Count unique items (not total quantities)
    const getTotalItems = useCallback(() => cartItems.length, [cartItems])
    const getTotalAmount = useCallback(
        () => cartItems.reduce((s, i) => s + calculatePrice(i.menuItem.price, i.quantity), 0),
        [cartItems]
    )

    const value: CartContextType = useMemo(() => ({
        cartItems,
        isOpen,
        activeRestaurantId,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        resetAfterLogout,
        getTotalItems,
        getTotalAmount,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
    }), [
        cartItems,
        isOpen,
        activeRestaurantId,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        resetAfterLogout,
        getTotalItems,
        getTotalAmount
    ])

    return React.createElement(CartContext.Provider, { value }, children)
}

export function useCart(): CartContextType {
    const ctx = React.useContext(CartContext)
    if (!ctx) {
        throw new Error('useCart must be used within CartProvider')
    }
    return ctx
}
