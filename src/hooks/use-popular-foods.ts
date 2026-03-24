import { useState, useEffect, useCallback, useRef } from 'react'
import { Food } from '@/types/models'
import { FoodService, FoodServiceFilters } from '@/services/food.service'

interface UsePopularFoodsReturn {
    foods: Food[]
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

// Serialize filter values so we only refetch when they change, not when the object reference changes
function getFilterKey(filters: FoodServiceFilters): string {
    return JSON.stringify({
        limit: filters.limit,
        page: filters.page,
        restaurantId: filters.restaurantId,
        category: filters.category,
        search: filters.search,
        isAvailable: filters.isAvailable
    })
}

export function usePopularFoods(filters: FoodServiceFilters = {}): UsePopularFoodsReturn {
    const [foods, setFoods] = useState<Food[]>([])
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

    const fetchFoods = useCallback(async () => {
        const currentFilters = filtersRef.current
        try {
            setLoading(true)
            setError(null)

            const response = await FoodService.getPopularFoodsDebounced(currentFilters)
            setFoods(response.foods)
            setPagination(response.pagination)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch foods'
            setError(errorMessage)
            console.error('Error in usePopularFoods:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchFoods()
    }, [filterKey, fetchFoods])

    return {
        foods,
        loading,
        error,
        pagination,
        refetch: fetchFoods,
    }
}
