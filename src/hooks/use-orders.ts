"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { OrderService, Order, OrderFilters } from '@/services/order.service'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

export function useOrders() {
    const [orders, setOrders] = useState<Order[]>([])
    const [allOrders, setAllOrders] = useState<Order[]>([]) // Cache all orders
    const [activeFilters, setActiveFilters] = useState<OrderFilters>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [total, setTotal] = useState(0)
    const hasMore = false
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const isFetchingRef = useRef(false)
    const lastFetchTimeRef = useRef(0)

    const applyFilters = useCallback((inputOrders: Order[], filters: OrderFilters) => {
        let filteredOrders = [...inputOrders]

        if (filters.status) {
            const bucket = filters.status
            if (bucket === 'bucket_to_ship') {
                filteredOrders = filteredOrders.filter(order =>
                    ['pending', 'confirmed', 'preparing'].includes(order.status)
                )
            } else if (bucket === 'bucket_to_receive') {
                filteredOrders = filteredOrders.filter(order =>
                    order.status === 'out_for_delivery'
                )
            } else if (bucket === 'bucket_completed') {
                filteredOrders = filteredOrders.filter(order =>
                    order.status === 'delivered' || order.status === 'completed'
                )
            } else if (bucket === 'bucket_return_refund') {
                filteredOrders = filteredOrders.filter(order => order.status === 'refunded')
            } else if (bucket === 'bucket_cancel') {
                filteredOrders = filteredOrders.filter(order => order.status === 'cancelled')
            } else {
                // fallback to raw status match
                filteredOrders = filteredOrders.filter(order => order.status === filters.status)
            }
        }

        if (filters.startDate || filters.endDate) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt)
                if (filters.startDate && orderDate < new Date(filters.startDate)) return false
                if (filters.endDate && orderDate > new Date(filters.endDate)) return false
                return true
            })
        }

        return filteredOrders
    }, [])

    // localStorage functions
    const getCachedOrders = useCallback(() => {
        if (typeof window === 'undefined') return null
        try {
            const cached = localStorage.getItem('orders_cache')
            if (cached) {
                const data = JSON.parse(cached)
                if (Date.now() - data.timestamp < 5 * 60 * 1000) {
                    return data.orders
                }
            }
        } catch {
            // Ignore cache errors
        }
        return null
    }, [])

    const setCachedOrders = useCallback((orders: Order[]) => {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem('orders_cache', JSON.stringify({
                orders,
                timestamp: Date.now()
            }))
        } catch {
            // Ignore cache errors
        }
    }, [])

    const fetchOrders = useCallback(async (filters?: OrderFilters, options?: { force?: boolean }) => {
        // Check authentication first
        if (!isAuthenticated) {
            setError('Please sign in to view your orders')
            setLoading(false)
            return
        }

        if (isFetchingRef.current) {
            return
        }

        if (!options?.force) {
            const now = Date.now()
            if (now - lastFetchTimeRef.current < 5000) {
                return
            }
        }

        isFetchingRef.current = true
        lastFetchTimeRef.current = Date.now()

        try {
            setLoading(true)
            setError(null)

            // Check cache first (skip when forcing a fresh fetch)
            const cachedOrders = getCachedOrders()
            if (cachedOrders && !filters && !options?.force) {
                setAllOrders(cachedOrders)
                const next = applyFilters(cachedOrders, activeFilters)
                setOrders(next)
                setTotal(next.length)
                setLoading(false)
                return
            }

            // Fetch from API
            const response = await OrderService.getUserOrders({
                page: 1,
                limit: 100
            })

            setCachedOrders(response.orders)
            setAllOrders(response.orders)
            const next = applyFilters(response.orders, activeFilters)
            setOrders(next)
            setTotal(next.length)
        } catch (err: any) {
            if (err?.status === 401 || err?.message?.includes('Unauthorized') || err?.message?.includes('Authentication required')) {
                setError('Your session has expired. Please sign in again.')
                router.push('/signin')
                return
            }

            if (err?.status >= 500) {
                setError('Server error. Please try again later.')
                return
            }

            if (err?.status >= 400 && err?.status < 500) {
                setError(err?.message || 'Request failed. Please check your connection.')
                return
            }

            setError(err instanceof Error ? err.message : 'Failed to fetch orders')
        } finally {
            setLoading(false)
            isFetchingRef.current = false
        }
    }, [isAuthenticated, getCachedOrders, setCachedOrders, router, applyFilters, activeFilters])

    const loadMore = useCallback(() => {
        // All orders loaded at once, no pagination needed
    }, [])

    const refreshOrders = useCallback(async (options?: { force?: boolean }) => {
        if (!isAuthenticated) return

        // Clear cache and fetch fresh data
        if (typeof window !== 'undefined') {
            localStorage.removeItem('orders_cache')
        }

        await fetchOrders(undefined, options)
    }, [isAuthenticated, fetchOrders])

    const filterOrders = useCallback((filters: OrderFilters) => {
        if (!isAuthenticated || allOrders.length === 0) return

        setActiveFilters(filters)
        const next = applyFilters(allOrders, filters)
        setOrders(next)
        setTotal(next.length)
    }, [isAuthenticated, allOrders, applyFilters])

    useEffect(() => {
        // Only fetch orders if user is authenticated
        if (!authLoading && isAuthenticated) {
            fetchOrders(undefined, { force: true })
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false)
            setError('Please sign in to view your orders')
        }
    }, [isAuthenticated, authLoading, fetchOrders])

    return {
        orders,
        loading: loading || authLoading,
        error,
        total,
        hasMore,
        loadMore,
        refreshOrders,
        filterOrders
    }
}
