import { useState, useEffect, useCallback, useMemo } from 'react'
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

    // Memoize filters to prevent unnecessary re-renders when object reference changes but values don't
    const stableFilters = useMemo(() => {
        return filters
    }, [
        filters.limit,
        filters.page,
        filters.restaurantId,
        filters.category,
        filters.search,
        filters.isAvailable
    ])

    const fetchFoods = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await FoodService.getPopularFoodsDebounced(stableFilters)
            setFoods(response.foods)
            setPagination(response.pagination)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch foods'
            setError(errorMessage)
            console.error('Error in usePopularFoods:', err)
        } finally {
            setLoading(false)
        }
    }, [stableFilters])

    useEffect(() => {
        fetchFoods()
    }, [fetchFoods])

    return {
        foods,
        loading,
        error,
        pagination,
        refetch: fetchFoods,
    }
}
