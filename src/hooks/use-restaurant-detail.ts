"use client"
import * as React from 'react'
import type { Restaurant, MenuItem } from '@/types/models'
import { RestaurantService } from '@/services/restaurant.service'
import { FoodService } from '@/services/food.service'
import { mapRestaurantToVM, mapFoodToMenuItem } from '@/lib/mappers/restaurant'
import { CATALOG_REFETCH_INTERVAL_MS } from '@/hooks/catalog-hooks'
import { useDeliveryDestination } from '@/contexts/delivery-destination-context'

interface UseRestaurantResult {
    restaurant: Restaurant | null
    items: MenuItem[]
    loading: boolean
    error: string | null
    refetch: () => void
}

export function useRestaurantDetail(id: string): UseRestaurantResult {
    const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
    const [items, setItems] = React.useState<MenuItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const { destination } = useDeliveryDestination()

    // Memoize the ID to prevent unnecessary re-renders
    const memoizedId = React.useMemo(() => id, [id])

    const load = React.useCallback(async (opts?: { silent?: boolean }) => {
        const silent = opts?.silent === true
        if (!memoizedId) {
            if (!silent) {
                setLoading(false)
                setRestaurant(null)
                setItems([])
            }
            return
        }
        if (!silent) {
            setLoading(true)
        }
        setError(null)
        try {
            const [r, foodsResp] = await Promise.all([
                RestaurantService.getRestaurantById(memoizedId, {
                    ...(destination?.lat != null && destination?.lng != null
                        ? { destLat: destination.lat, destLng: destination.lng }
                        : {}),
                    ...(destination?.lat == null || destination?.lng == null
                        ? (destination?.address ? { destAddress: destination.address } : {})
                        : {}),
                }),
                FoodService.getAllFoods({ restaurantId: memoizedId, limit: 100 })
            ])

            setRestaurant(mapRestaurantToVM(r))
            setItems((foodsResp.foods || []).map(mapFoodToMenuItem))
        } catch (e) {
            if (!silent) {
                console.error('Failed to load restaurant detail:', e)
                setError('Failed to load restaurant')
            } else {
                console.warn('useRestaurantDetail: background refetch failed', e)
            }
        } finally {
            if (!silent) {
                setLoading(false)
            }
        }
    }, [memoizedId, destination?.lat, destination?.lng, destination?.address])

    React.useEffect(() => {
        // Simple debounce to prevent double calls
        const timeoutId = setTimeout(() => {
            void load()
        }, 100)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [load])

    React.useEffect(() => {
        if (!memoizedId) return
        const id = window.setInterval(() => {
            if (document.visibilityState !== 'visible') return
            void load({ silent: true })
        }, CATALOG_REFETCH_INTERVAL_MS)
        return () => window.clearInterval(id)
    }, [memoizedId, load])

    React.useEffect(() => {
        if (!memoizedId) return
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                void load({ silent: true })
            }
        }
        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
    }, [memoizedId, load])

    return { restaurant, items, loading, error, refetch: load }
}

export function useRestaurantCategoryNav(items: MenuItem[]) {
    const [activeCategory, setActiveCategory] = React.useState<string>('')
    const categoryRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

    const categories = React.useMemo(
        () => Array.from(new Set(items.map(i => i.category))),
        [items]
    )

    React.useEffect(() => {
        if (!activeCategory && categories.length > 0) {
            setActiveCategory(categories[0])
        }
    }, [categories, activeCategory])

    const handleSelectCategory = (category: string) => {
        setActiveCategory(category)
        const el = categoryRefs.current[category]
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 120
            window.scrollTo({ top: y, behavior: 'smooth' })
        }
    }

    const getCount = (category: string) => items.filter(i => i.category === category).length

    return { activeCategory, setActiveCategory, categoryRefs, categories, handleSelectCategory, getCount }
}


