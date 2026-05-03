import { API_BASE_URL } from '@/services/api'
import { buildQueryString, requestJson } from '@/lib/http'

function favoritesBaseUrl(): string {
  return `${API_BASE_URL}/favorites`
}

const GET_OPTIONS: RequestInit = { method: 'GET', cache: 'no-store' }

export type FavoritesPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type FavoriteRestaurantListItem = {
  id: string
  name: string
  description: string
  address: string
  phone: string
  avatarUrl: string
  isOpen: boolean
  openHours: string
  closeHours: string
  createdAt: string
  favoritedAt: string
}

export type FavoriteFoodListItem = {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
  isAvailable: boolean
  restaurantId: string
  restaurantName: string
  categoryId: string
  categoryName: string
  createdAt: string
  favoritedAt: string
}

export class FavoritesService {
  static async getRestaurantFavoriteStatus(restaurantId: string): Promise<{ isFavorite: boolean }> {
    const url = `${favoritesBaseUrl()}/restaurants/${encodeURIComponent(restaurantId)}/status`
    return requestJson<{ isFavorite: boolean }>(url, GET_OPTIONS)
  }

  static async addFavoriteRestaurant(restaurantId: string): Promise<{ isFavorite: true }> {
    const url = `${favoritesBaseUrl()}/restaurants/${encodeURIComponent(restaurantId)}`
    return requestJson<{ isFavorite: true }>(url, { method: 'POST', cache: 'no-store' })
  }

  static async removeFavoriteRestaurant(restaurantId: string): Promise<{ isFavorite: false }> {
    const url = `${favoritesBaseUrl()}/restaurants/${encodeURIComponent(restaurantId)}`
    return requestJson<{ isFavorite: false }>(url, { method: 'DELETE', cache: 'no-store' })
  }

  static async listFavoriteRestaurants(params: { page?: number; limit?: number } = {}): Promise<{
    items: FavoriteRestaurantListItem[]
    pagination: FavoritesPagination
  }> {
    const qs = buildQueryString(params)
    const url = `${favoritesBaseUrl()}/restaurants${qs ? `?${qs}` : ''}`
    return requestJson(url, GET_OPTIONS)
  }

  static async getFoodFavoriteStatus(foodId: string): Promise<{ isFavorite: boolean }> {
    const url = `${favoritesBaseUrl()}/foods/${encodeURIComponent(foodId)}/status`
    return requestJson<{ isFavorite: boolean }>(url, GET_OPTIONS)
  }

  static async addFavoriteFood(foodId: string): Promise<{ isFavorite: true }> {
    const url = `${favoritesBaseUrl()}/foods/${encodeURIComponent(foodId)}`
    return requestJson<{ isFavorite: true }>(url, { method: 'POST', cache: 'no-store' })
  }

  static async removeFavoriteFood(foodId: string): Promise<{ isFavorite: false }> {
    const url = `${favoritesBaseUrl()}/foods/${encodeURIComponent(foodId)}`
    return requestJson<{ isFavorite: false }>(url, { method: 'DELETE', cache: 'no-store' })
  }

  static async listFavoriteFoods(params: { page?: number; limit?: number } = {}): Promise<{
    items: FavoriteFoodListItem[]
    pagination: FavoritesPagination
  }> {
    const qs = buildQueryString(params)
    const url = `${favoritesBaseUrl()}/foods${qs ? `?${qs}` : ''}`
    return requestJson(url, GET_OPTIONS)
  }
}

