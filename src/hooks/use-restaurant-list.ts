import { useState, useEffect, useCallback, useRef } from 'react'
import { RestaurantService, RestaurantFilters } from '@/services/restaurant.service'
import { Restaurant } from '@/types/models'
import { CATALOG_REFETCH_INTERVAL_MS } from '@/hooks/catalog-refetch'
import { useDeliveryDestination } from '@/contexts/delivery-destination-context'

export interface UseRestaurantListOptions {
  /** Background refetch; keeps list in sync when admin toggles shop visibility. */
  refetchIntervalMs?: number
  /** Refetch when user returns to this browser tab (Page Visibility API). */
  refetchOnVisibility?: boolean
}

interface UseRestaurantsReturn {
    restaurants: Restaurant[]
    loading: boolean
    error: string | null
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
    refetch: () => Promise<void>
}

function getFilterKey(filters: RestaurantFilters): string {
    return JSON.stringify({
        search: filters.search,
        category: filters.category,
        isOpen: filters.isOpen,
        minRating: filters.minRating,
        page: filters.page,
        limit: filters.limit
    })
}

export function useRestaurantList(
    filters: RestaurantFilters = {},
    options: UseRestaurantListOptions = {},
): UseRestaurantsReturn {
    const {
        refetchIntervalMs = CATALOG_REFETCH_INTERVAL_MS,
        refetchOnVisibility = true,
    } = options

    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    })

    const { destination } = useDeliveryDestination()

    const filtersRef = useRef(filters)
    filtersRef.current = filters

    const filterKey = getFilterKey(filters)

    const fetchRestaurants = useCallback(async (opts?: { silent?: boolean }) => {
        const silent = opts?.silent === true
        const currentFilters = filtersRef.current
        try {
            if (!silent) {
                setLoading(true)
            }
            setError(null)

            const response = await RestaurantService.getRestaurantsDebounced(currentFilters, {
                ...(destination?.lat != null && destination?.lng != null
                    ? { destLat: destination.lat, destLng: destination.lng }
                    : {}),
                ...(destination?.lat == null || destination?.lng == null
                    ? (destination?.address ? { destAddress: destination.address } : {})
                    : {}),
            })

            setRestaurants(response.restaurants)
            setPagination(response.pagination)
        } catch (err) {
            if (!silent) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch restaurants'
                setError(errorMessage)
                console.error('Error in useRestaurantList:', err)
            } else {
                console.warn('useRestaurantList: background refetch failed', err)
            }
        } finally {
            if (!silent) {
                setLoading(false)
            }
        }
    }, [destination?.lat, destination?.lng, destination?.address])

    useEffect(() => {
        void fetchRestaurants()
    }, [filterKey, fetchRestaurants])

    useEffect(() => {
        if (!refetchIntervalMs || refetchIntervalMs < 5_000) return
        const id = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return
            void fetchRestaurants({ silent: true })
        }, refetchIntervalMs)
        return () => window.clearInterval(id)
    }, [refetchIntervalMs, filterKey, fetchRestaurants])

    useEffect(() => {
        if (!refetchOnVisibility) return
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchRestaurants({ silent: true })
            }
        }
        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
    }, [refetchOnVisibility, fetchRestaurants])

    return {
        restaurants,
        loading,
        error,
        pagination,
        refetch: () => fetchRestaurants(),
    }
}


