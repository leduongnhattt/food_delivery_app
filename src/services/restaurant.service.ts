import { apiClient, type ApiResponse } from './api'
import { API_BASE_URL } from './api'
import { Restaurant } from '@/types/models'
import { BaseService } from '@/lib/base-service'
import { buildQueryString, requestJson } from '@/lib/http-client'
import { createDebouncedApiCall } from '@/lib/debounce'

/** Base URL for restaurants APIs (Nest or Next). */
function getRestaurantsBase(): string {
  return `${API_BASE_URL}/restaurants`
}

export interface RestaurantFilters {
  search?: string
  category?: string
  isOpen?: boolean
  minRating?: number
  page?: number
  limit?: number
}

interface RestaurantSearchParams {
  q?: string
  category?: string
  isOpen?: string
  minRating?: string
  maxPrice?: string
}

interface PaginatedResponse<T> {
  restaurants: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RestaurantReviewsResponse {
  reviews: Array<{
    id: string
    author: string
    rating: number
    content: string
    images: string[]
    createdAt: string
    updatedAt: string | null
  }>
  pagination: { page: number; limit: number; total: number; totalPages: number }
  averageRating: number
  totalReviews: number
}

const GET_OPTIONS: RequestInit = { method: 'GET', cache: 'no-store' }

export class RestaurantService extends BaseService {
  constructor() {
    super(getRestaurantsBase())
  }

  static async getRestaurants(
    filters: RestaurantFilters = {},
  ): Promise<PaginatedResponse<Restaurant>> {
    try {
      const queryString = buildQueryString(filters)
      const url = `${getRestaurantsBase()}${queryString ? `?${queryString}` : ''}`
      const response = await requestJson<{
        restaurants: Restaurant[]
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }>(url, GET_OPTIONS)
      return {
        restaurants: response.restaurants ?? [],
        pagination: response.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      return {
        restaurants: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      }
    }
  }

  static async getRestaurantById(id: string): Promise<Restaurant> {
    const response = await requestJson<Restaurant>(`${getRestaurantsBase()}/${id}`, GET_OPTIONS)
    return response
  }

  static async searchRestaurants(
    params: RestaurantSearchParams,
  ): Promise<Restaurant[]> {
    try {
      const queryString = buildQueryString(params)
      const url = `${getRestaurantsBase()}${queryString ? `?${queryString}` : ''}`
      const response = await requestJson<{ restaurants: Restaurant[] }>(url, GET_OPTIONS)
      return response.restaurants ?? []
    } catch (error) {
      console.error('Error searching restaurants:', error)
      return []
    }
  }

  static async getReviews(
    enterpriseId: string,
    params: { sort?: 'newest' | 'oldest'; page?: number; limit?: number } = {},
  ): Promise<RestaurantReviewsResponse> {
    const { sort = 'newest', page = 1, limit = 50 } = params
    const url = `${getRestaurantsBase()}/${enterpriseId}/reviews?sort=${sort}&page=${page}&limit=${limit}`
    const response = await requestJson<RestaurantReviewsResponse>(url, GET_OPTIONS)
    return {
      reviews: response.reviews ?? [],
      pagination: response.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 },
      averageRating: response.averageRating ?? 0,
      totalReviews: response.totalReviews ?? 0,
    }
  }

  static async getCommission(
    enterpriseId: string,
  ): Promise<{ success: boolean; commissionFee?: number; error?: string }> {
    const response = await requestJson<{
      success: boolean
      commissionFee?: number
      error?: string
    }>(`${getRestaurantsBase()}/${enterpriseId}/commission`, GET_OPTIONS)
    return response
  }

  static async createRestaurant(
    data: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Restaurant> {
    const response = await apiClient.post<Restaurant>('/restaurants', data)
    RestaurantService.ensureSuccess<Restaurant>(response, 'Failed to create restaurant')
    return response
  }

  static async updateRestaurant(
    id: string,
    data: Partial<Restaurant>,
  ): Promise<Restaurant> {
    const response = await apiClient.put<Restaurant>(`/restaurants/${id}`, data)
    RestaurantService.ensureSuccess<Restaurant>(response, 'Failed to update restaurant')
    return response
  }

  static async deleteRestaurant(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/restaurants/${id}`)
    RestaurantService.ensureSuccess<{ message: string }>(response, 'Failed to delete restaurant')
    return response
  }

  static async getCategories(
    restaurantId?: string,
  ): Promise<Array<{ category: string; count: number }>> {
    const params = restaurantId ? { restaurantId } : undefined
    const response = await apiClient.get<Array<{ category: string; count: number }>>(
      '/categories',
      params,
    )
    RestaurantService.ensureSuccess<Array<{ category: string; count: number }>>(
      response,
      'Failed to fetch categories',
    )
    return response
  }

  static async getPopularRestaurants(limit: number = 6): Promise<Restaurant[]> {
    const response = await apiClient.get<Restaurant[] | PaginatedResponse<Restaurant>>(
      '/restaurants',
      { limit, minRating: 4.0 },
    )
    if (response && 'restaurants' in response) {
      return (response as PaginatedResponse<Restaurant>).restaurants ?? []
    }
    RestaurantService.ensureSuccess<Restaurant[]>(response, 'Failed to fetch popular restaurants')
    return response as Restaurant[]
  }

  static async getNearbyRestaurants(lat: number, lng: number): Promise<Restaurant[]> {
    const response = await apiClient.get<Restaurant[] | PaginatedResponse<Restaurant>>(
      '/restaurants',
      { limit: 10, lat, lng },
    )
    if (response && 'restaurants' in response) {
      return (response as PaginatedResponse<Restaurant>).restaurants ?? []
    }
    RestaurantService.ensureSuccess<Restaurant[]>(response, 'Failed to fetch nearby restaurants')
    return response as Restaurant[]
  }

  static getRestaurantsDebounced = createDebouncedApiCall(
    RestaurantService.getRestaurants,
    200,
  )

  private static isApiError(response: unknown): response is ApiResponse {
    return (
      !!response &&
      typeof response === 'object' &&
      'success' in response &&
      (response as ApiResponse).success === false
    )
  }

  private static ensureSuccess<T>(
    response: T | ApiResponse,
    errorMessage: string,
  ): asserts response is T {
    if (RestaurantService.isApiError(response)) {
      throw new Error((response as ApiResponse).error || errorMessage)
    }
  }
}
