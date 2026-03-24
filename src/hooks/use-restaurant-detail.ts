"use client"
import * as React from 'react'
import type { Restaurant, MenuItem } from '@/types/models'
import { RestaurantService } from '@/services/restaurant.service'
import { FoodService } from '@/services/food.service'
import { mapRestaurantToVM, mapFoodToMenuItem } from '@/lib/mappers/restaurant'

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

    // Memoize the ID to prevent unnecessary re-renders
    const memoizedId = React.useMemo(() => id, [id])

    const load = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [r, foodsResp] = await Promise.all([
                RestaurantService.getRestaurantById(memoizedId),
                FoodService.getAllFoods({ restaurantId: memoizedId, limit: 100 })
            ])

            setRestaurant(mapRestaurantToVM(r))
            setItems((foodsResp.foods || []).map(mapFoodToMenuItem))
        } catch (e) {
            console.error('Failed to load restaurant detail:', e)
            setError('Failed to load restaurant')
        } finally {
            setLoading(false)
        }
    }, [memoizedId])

    React.useEffect(() => {
        // Simple debounce to prevent double calls
        const timeoutId = setTimeout(() => {
            load()
        }, 100)

        return () => {
            clearTimeout(timeoutId)
        }
    }, [load])

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


