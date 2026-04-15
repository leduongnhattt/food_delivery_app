import { useState, useEffect, useCallback, useRef } from 'react'
import { Food } from '@/types/models'
import { FoodService, FoodServiceFilters } from '@/services/food.service'
import { CATALOG_REFETCH_INTERVAL_MS } from '@/hooks/catalog-refetch'

export interface UsePopularFoodsOptions {
  /** When false, no network calls (e.g. FoodsSlideMenu with sample data only). */
  enabled?: boolean
  refetchIntervalMs?: number
  refetchOnVisibility?: boolean
}

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

export function usePopularFoods(
    filters: FoodServiceFilters = {},
    options: UsePopularFoodsOptions = {},
): UsePopularFoodsReturn {
    const {
        enabled = true,
        refetchIntervalMs = CATALOG_REFETCH_INTERVAL_MS,
        refetchOnVisibility = true,
    } = options

    const [foods, setFoods] = useState<Food[]>([])
    const [loading, setLoading] = useState(enabled)
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

    const fetchFoods = useCallback(async (opts?: { silent?: boolean }) => {
        const silent = opts?.silent === true
        const currentFilters = filtersRef.current
        try {
            if (!silent) {
                setLoading(true)
            }
            setError(null)

            const response = await FoodService.getPopularFoodsDebounced(currentFilters)
            setFoods(response.foods)
            setPagination(response.pagination)
        } catch (err) {
            if (!silent) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch foods'
                setError(errorMessage)
                console.error('Error in usePopularFoods:', err)
            } else {
                console.warn('usePopularFoods: background refetch failed', err)
            }
        } finally {
            if (!silent) {
                setLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        if (!enabled) {
            setLoading(false)
            setFoods([])
            setError(null)
            return
        }
        void fetchFoods()
    }, [enabled, filterKey, fetchFoods])

    useEffect(() => {
        if (!enabled || !refetchIntervalMs || refetchIntervalMs < 5_000) return
        const id = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return
            void fetchFoods({ silent: true })
        }, refetchIntervalMs)
        return () => window.clearInterval(id)
    }, [enabled, refetchIntervalMs, filterKey, fetchFoods])

    useEffect(() => {
        if (!enabled || !refetchOnVisibility) return
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void fetchFoods({ silent: true })
            }
        }
        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
    }, [enabled, refetchOnVisibility, fetchFoods])

    return {
        foods,
        loading,
        error,
        pagination,
        refetch: () => fetchFoods(),
    }
}
