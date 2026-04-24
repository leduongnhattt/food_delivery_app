"use client"

import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { Food, MenuItem, Restaurant } from "@/types/models"
import { FoodService, type FoodServiceFilters } from "@/services/food.service"
import { RestaurantService, type RestaurantFilters } from "@/services/restaurant.service"
import { mapFoodToMenuItem, mapRestaurantToVM } from "@/lib/mappers/restaurant"
import { useDeliveryDestination } from "@/contexts/delivery-destination-context"

/**
 * Default interval for re-fetching storefront catalog (restaurants / foods) so changes
 * from admin (activate / deactivate) appear without a manual refresh.
 * Not truly real-time; use WebSockets/SSE if you need instant cross-user updates.
 */
export const CATALOG_REFETCH_INTERVAL_MS = 30_000

export type VisibilityIntervalRefetchOptions = {
  enabled?: boolean
  intervalMs?: number
  refetchOnVisibility?: boolean
  onlyWhenVisible?: boolean
  minIntervalMs?: number
}

/**
 * Shared helper for catalog-style background refetch:
 * - periodic interval refetch (optionally only while tab is visible)
 * - refetch on `visibilitychange` when tab becomes visible
 *
 * Important: `refetch` should preserve its own semantics (e.g. support `{ silent: true }` in closure).
 */
export function useVisibilityIntervalRefetch(
  refetch: () => void | Promise<void>,
  depsKey: string,
  {
    enabled = true,
    intervalMs,
    refetchOnVisibility = true,
    onlyWhenVisible = true,
    minIntervalMs = 5_000,
  }: VisibilityIntervalRefetchOptions,
) {
  useEffect(() => {
    if (!enabled) return
    if (!intervalMs) return
    if (intervalMs < minIntervalMs) return

    const id = window.setInterval(() => {
      if (onlyWhenVisible && document.visibilityState !== "visible") return
      void refetch()
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [enabled, intervalMs, minIntervalMs, onlyWhenVisible, depsKey, refetch])

  useEffect(() => {
    if (!enabled) return
    if (!refetchOnVisibility) return

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refetch()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [enabled, refetchOnVisibility, refetch])
}

export interface UseRestaurantListOptions {
  refetchIntervalMs?: number
  refetchOnVisibility?: boolean
}

type UseRestaurantsReturn = {
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

function getRestaurantFilterKey(filters: RestaurantFilters): string {
  return JSON.stringify({
    search: filters.search,
    category: filters.category,
    isOpen: filters.isOpen,
    minRating: filters.minRating,
    page: filters.page,
    limit: filters.limit,
  })
}

export function useRestaurantList(
  filters: RestaurantFilters = {},
  options: UseRestaurantListOptions = {},
): UseRestaurantsReturn {
  const { refetchIntervalMs = CATALOG_REFETCH_INTERVAL_MS, refetchOnVisibility = true } = options

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const { destination } = useDeliveryDestination()

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const filterKey = getRestaurantFilterKey(filters)

  const fetchRestaurants = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true
      const currentFilters = filtersRef.current
      try {
        if (!silent) setLoading(true)
        setError(null)

        const response = await RestaurantService.getRestaurantsDebounced(currentFilters, {
          ...(destination?.lat != null && destination?.lng != null
            ? { destLat: destination.lat, destLng: destination.lng }
            : {}),
          ...(destination?.lat == null || destination?.lng == null
            ? destination?.address
              ? { destAddress: destination.address }
              : {}
            : {}),
        })

        setRestaurants(response.restaurants)
        setPagination(response.pagination)
      } catch (err) {
        if (!silent) {
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch restaurants"
          setError(errorMessage)
          console.error("Error in useRestaurantList:", err)
        } else {
          console.warn("useRestaurantList: background refetch failed", err)
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [destination?.lat, destination?.lng, destination?.address],
  )

  useEffect(() => {
    void fetchRestaurants()
  }, [filterKey, fetchRestaurants])

  useVisibilityIntervalRefetch(
    () => fetchRestaurants({ silent: true }),
    filterKey,
    {
      enabled: true,
      intervalMs: refetchIntervalMs,
      refetchOnVisibility,
      onlyWhenVisible: true,
      minIntervalMs: 5_000,
    },
  )

  return {
    restaurants,
    loading,
    error,
    pagination,
    refetch: () => fetchRestaurants(),
  }
}

type UseRestaurantResult = {
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

  const memoizedId = React.useMemo(() => id, [id])

  const load = React.useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true
      if (!memoizedId) {
        if (!silent) {
          setLoading(false)
          setRestaurant(null)
          setItems([])
        }
        return
      }
      if (!silent) setLoading(true)
      setError(null)
      try {
        const [r, foodsResp] = await Promise.all([
          RestaurantService.getRestaurantById(memoizedId, {
            ...(destination?.lat != null && destination?.lng != null
              ? { destLat: destination.lat, destLng: destination.lng }
              : {}),
            ...(destination?.lat == null || destination?.lng == null
              ? destination?.address
                ? { destAddress: destination.address }
                : {}
              : {}),
          }),
          FoodService.getAllFoods({ restaurantId: memoizedId, limit: 100 }),
        ])

        setRestaurant(mapRestaurantToVM(r))
        setItems((foodsResp.foods || []).map(mapFoodToMenuItem))
      } catch (e) {
        if (!silent) {
          console.error("Failed to load restaurant detail:", e)
          setError("Failed to load restaurant")
        } else {
          console.warn("useRestaurantDetail: background refetch failed", e)
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [memoizedId, destination?.lat, destination?.lng, destination?.address],
  )

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      void load()
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [load])

  useVisibilityIntervalRefetch(
    () => load({ silent: true }),
    memoizedId || "__no_id__",
    {
      enabled: !!memoizedId,
      intervalMs: CATALOG_REFETCH_INTERVAL_MS,
      refetchOnVisibility: true,
      onlyWhenVisible: true,
      minIntervalMs: 5_000,
    },
  )

  return { restaurant, items, loading, error, refetch: load }
}

export function useRestaurantCategoryNav(items: MenuItem[]) {
  const [activeCategory, setActiveCategory] = React.useState<string>("")
  const categoryRefs = React.useRef<Record<string, HTMLDivElement | null>>({})

  const categories = React.useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items])

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
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  const getCount = (category: string) => items.filter((i) => i.category === category).length

  return { activeCategory, setActiveCategory, categoryRefs, categories, handleSelectCategory, getCount }
}

export interface UsePopularFoodsOptions {
  enabled?: boolean
  refetchIntervalMs?: number
  refetchOnVisibility?: boolean
}

type UsePopularFoodsReturn = {
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

function getFoodFilterKey(filters: FoodServiceFilters): string {
  return JSON.stringify({
    limit: filters.limit,
    page: filters.page,
    restaurantId: filters.restaurantId,
    category: filters.category,
    search: filters.search,
    isAvailable: filters.isAvailable,
  })
}

export function usePopularFoods(
  filters: FoodServiceFilters = {},
  options: UsePopularFoodsOptions = {},
): UsePopularFoodsReturn {
  const { enabled = true, refetchIntervalMs = CATALOG_REFETCH_INTERVAL_MS, refetchOnVisibility = true } = options

  const [foods, setFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const filtersRef = useRef(filters)
  filtersRef.current = filters

  const filterKey = getFoodFilterKey(filters)

  const fetchFoods = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    const currentFilters = filtersRef.current
    try {
      if (!silent) setLoading(true)
      setError(null)

      const response = await FoodService.getPopularFoodsDebounced(currentFilters)
      setFoods(response.foods)
      setPagination(response.pagination)
    } catch (err) {
      if (!silent) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch foods"
        setError(errorMessage)
        console.error("Error in usePopularFoods:", err)
      } else {
        console.warn("usePopularFoods: background refetch failed", err)
      }
    } finally {
      if (!silent) setLoading(false)
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

  useVisibilityIntervalRefetch(
    () => fetchFoods({ silent: true }),
    filterKey,
    {
      enabled,
      intervalMs: refetchIntervalMs,
      refetchOnVisibility,
      onlyWhenVisible: true,
      minIntervalMs: 5_000,
    },
  )

  return {
    foods,
    loading,
    error,
    pagination,
    refetch: () => fetchFoods(),
  }
}

