"use client"

import { useState, useEffect, useCallback } from 'react'
import { OrderService, Order, OrderFilters } from '@/services/order.service'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'

export function useOrders() {
    const [orders, setOrders] = useState<Order[]>([])
    const [allOrders, setAllOrders] = useState<Order[]>([]) // Cache all orders
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [total, setTotal] = useState(0)
    const hasMore = false
    const { isAuthenticated, isLoading: authLoading } = useAuth()
    const router = useRouter()

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

    const fetchOrders = useCallback(async (filters?: OrderFilters) => {
        try {
            setLoading(true)
            setError(null)

            // Check authentication first
            if (!isAuthenticated) {
                setError('Please sign in to view your orders')
                setLoading(false)
                return
            }

            // Check cache first
            const cachedOrders = getCachedOrders()
            if (cachedOrders && !filters) {
                setAllOrders(cachedOrders)
                setOrders(cachedOrders)
                setTotal(cachedOrders.length)
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
            setOrders(response.orders)
            setTotal(response.orders.length)
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
        }
    }, [isAuthenticated, getCachedOrders, setCachedOrders, router])

    const loadMore = useCallback(() => {
        // All orders loaded at once, no pagination needed
    }, [])

    const refreshOrders = useCallback(() => {
        if (isAuthenticated) {
            // Clear cache and fetch fresh data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('orders_cache')
            }
            fetchOrders({})
        }
    }, [isAuthenticated, fetchOrders])

    const filterOrders = useCallback((filters: OrderFilters) => {
        if (!isAuthenticated || allOrders.length === 0) return

        let filteredOrders = [...allOrders]

        if (filters.status) {
            filteredOrders = filteredOrders.filter(order => order.status === filters.status)
        }

        if (filters.startDate || filters.endDate) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.createdAt)
                if (filters.startDate && orderDate < new Date(filters.startDate)) return false
                if (filters.endDate && orderDate > new Date(filters.endDate)) return false
                return true
            })
        }

        setOrders(filteredOrders)
        setTotal(filteredOrders.length)
    }, [isAuthenticated, allOrders])

    useEffect(() => {
        // Only fetch orders if user is authenticated
        if (!authLoading && isAuthenticated) {
            fetchOrders({})
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
