"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { isAuthenticated } from "@/lib/auth-helpers"
import { FavoritesService, type FavoriteFoodListItem, type FavoriteRestaurantListItem } from "@/services/favorites.service"
import { useToast } from "@/contexts/toast-context"

type FavoriteStatusState = {
  loading: boolean
  isFavorite: boolean
  error: string | null
}

export function useFavoriteRestaurant(restaurantId: string) {
  const { showToast } = useToast()
  const [state, setState] = useState<FavoriteStatusState>({
    loading: true,
    isFavorite: false,
    error: null,
  })

  const idKey = useMemo(() => restaurantId || "__missing__", [restaurantId])

  const load = useCallback(async () => {
    if (!restaurantId) {
      setState({ loading: false, isFavorite: false, error: "Missing restaurantId" })
      return
    }
    if (!isAuthenticated()) {
      setState({ loading: false, isFavorite: false, error: null })
      return
    }
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const { isFavorite } = await FavoritesService.getRestaurantFavoriteStatus(restaurantId)
      setState({ loading: false, isFavorite: !!isFavorite, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load favorite status"
      setState({ loading: false, isFavorite: false, error: message })
    }
  }, [restaurantId])

  useEffect(() => {
    void load()
  }, [idKey, load])

  const toggle = useCallback(async () => {
    if (!restaurantId) return { ok: false as const, reason: "missing_id" as const }
    if (!isAuthenticated()) return { ok: false as const, reason: "unauthenticated" as const }

    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const nextIsFavorite = !state.isFavorite
      if (nextIsFavorite) {
        await FavoritesService.addFavoriteRestaurant(restaurantId)
        showToast("Added to favorites", "success")
      } else {
        await FavoritesService.removeFavoriteRestaurant(restaurantId)
        showToast("Removed from favorites", "info")
      }
      setState({ loading: false, isFavorite: nextIsFavorite, error: null })
      return { ok: true as const, isFavorite: nextIsFavorite }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to toggle favorite"
      setState((prev) => ({ ...prev, loading: false, error: message }))
      showToast(message, "error")
      return { ok: false as const, reason: "error" as const }
    }
  }, [restaurantId, showToast, state.isFavorite])

  return {
    loading: state.loading,
    isFavorite: state.isFavorite,
    error: state.error,
    refresh: load,
    toggle,
  }
}

export function useFavoriteFood(foodId: string) {
  const { showToast } = useToast()
  const [state, setState] = useState<FavoriteStatusState>({
    loading: true,
    isFavorite: false,
    error: null,
  })

  const idKey = useMemo(() => foodId || "__missing__", [foodId])

  const load = useCallback(async () => {
    if (!foodId) {
      setState({ loading: false, isFavorite: false, error: "Missing foodId" })
      return
    }
    if (!isAuthenticated()) {
      setState({ loading: false, isFavorite: false, error: null })
      return
    }
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const { isFavorite } = await FavoritesService.getFoodFavoriteStatus(foodId)
      setState({ loading: false, isFavorite: !!isFavorite, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load favorite status"
      setState({ loading: false, isFavorite: false, error: message })
    }
  }, [foodId])

  useEffect(() => {
    void load()
  }, [idKey, load])

  const toggle = useCallback(async () => {
    if (!foodId) return { ok: false as const, reason: "missing_id" as const }
    if (!isAuthenticated()) return { ok: false as const, reason: "unauthenticated" as const }

    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const nextIsFavorite = !state.isFavorite
      if (nextIsFavorite) {
        await FavoritesService.addFavoriteFood(foodId)
        showToast("Added to favorites", "success")
      } else {
        await FavoritesService.removeFavoriteFood(foodId)
        showToast("Removed from favorites", "info")
      }
      setState({ loading: false, isFavorite: nextIsFavorite, error: null })
      return { ok: true as const, isFavorite: nextIsFavorite }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to toggle favorite"
      setState((prev) => ({ ...prev, loading: false, error: message }))
      showToast(message, "error")
      return { ok: false as const, reason: "error" as const }
    }
  }, [foodId, showToast, state.isFavorite])

  return {
    loading: state.loading,
    isFavorite: state.isFavorite,
    error: state.error,
    refresh: load,
    toggle,
  }
}

type FavoritesListType = "restaurants" | "foods"

export function useFavoritesList(params: { type: FavoritesListType; page?: number; limit?: number }) {
  const { type, page = 1, limit = 12 } = params

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restaurants, setRestaurants] = useState<FavoriteRestaurantListItem[]>([])
  const [foods, setFoods] = useState<FavoriteFoodListItem[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  const key = useMemo(() => JSON.stringify({ type, page, limit }), [type, page, limit])
  const keyRef = useRef(key)
  keyRef.current = key

  const load = useCallback(async () => {
    if (!isAuthenticated()) {
      setLoading(false)
      setError(null)
      setRestaurants([])
      setFoods([])
      setPagination({ page: 1, limit, total: 0, totalPages: 0 })
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (type === "restaurants") {
        const response = await FavoritesService.listFavoriteRestaurants({ page, limit })
        setRestaurants(response.items ?? [])
        setFoods([])
        setPagination(response.pagination ?? { page, limit, total: 0, totalPages: 0 })
      } else {
        const response = await FavoritesService.listFavoriteFoods({ page, limit })
        setFoods(response.items ?? [])
        setRestaurants([])
        setPagination(response.pagination ?? { page, limit, total: 0, totalPages: 0 })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load favorites"
      setError(message)
      setRestaurants([])
      setFoods([])
      setPagination({ page, limit, total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [type, page, limit])

  useEffect(() => {
    void load()
  }, [key, load])

  return { loading, error, restaurants, foods, pagination, refresh: load }
}

