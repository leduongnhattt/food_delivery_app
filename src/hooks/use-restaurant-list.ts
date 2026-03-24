import { useState, useEffect, useCallback, useRef } from 'react'
import { RestaurantService, RestaurantFilters } from '@/services/restaurant.service'
import { Restaurant } from '@/types/models'

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

export function useRestaurantList(filters: RestaurantFilters = {}): UseRestaurantsReturn {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    })

    const filtersRef = useRef(filters)
    filtersRef.current = filters

    const filterKey = getFilterKey(filters)

    const fetchRestaurants = useCallback(async () => {
        const currentFilters = filtersRef.current
        try {
            setLoading(true)
            setError(null)

            const response = await RestaurantService.getRestaurantsDebounced(currentFilters)

            setRestaurants(response.restaurants)
            setPagination(response.pagination)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch restaurants'
            setError(errorMessage)
            console.error('Error in useRestaurantList:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchRestaurants()
    }, [filterKey, fetchRestaurants])

    return {
        restaurants,
        loading,
        error,
        pagination,
        refetch: fetchRestaurants,
    }
}


