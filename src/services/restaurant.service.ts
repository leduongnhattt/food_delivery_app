import { apiClient, type ApiResponse } from './api'
import { Restaurant } from '@/types/models'
import { BaseService } from '@/lib/base-service'
import { buildQueryString, requestJson } from '@/lib/http-client'
import { createDebouncedApiCall } from '@/lib/debounce'

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

export class RestaurantService extends BaseService {
    constructor() {
        super('/api/restaurants')
    }

    // Get all restaurants with filters
    static async getRestaurants(filters: RestaurantFilters = {}): Promise<PaginatedResponse<Restaurant>> {
        try {
            const queryString = buildQueryString(filters)
            const url = `/api/restaurants${queryString ? `?${queryString}` : ''}`

            const response = await requestJson<{ restaurants: Restaurant[], pagination: any }>(url, {
                method: 'GET',
                cache: 'no-store'
            })

            return {
                restaurants: response.restaurants,
                pagination: response.pagination
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error)
            return {
                restaurants: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0
                }
            }
        }
    }

    // Get restaurant by ID
    static async getRestaurantById(id: string): Promise<Restaurant> {
        try {
            const response = await requestJson<Restaurant>(`/api/restaurants/${id}`, {
                method: 'GET',
                cache: 'no-store'
            })
            return response
        } catch (error) {
            console.error('Error fetching restaurant:', error)
            throw error
        }
    }

    // Search restaurants
    static async searchRestaurants(params: RestaurantSearchParams): Promise<Restaurant[]> {
        try {
            const queryString = buildQueryString(params)
            const url = `/api/restaurants${queryString ? `?${queryString}` : ''}`

            const response = await requestJson<{ restaurants: Restaurant[] }>(url, {
                method: 'GET',
                cache: 'no-store'
            })

            return response.restaurants || []
        } catch (error) {
            console.error('Error searching restaurants:', error)
            return []
        }
    }

    // Create new restaurant (admin only)
    static async createRestaurant(data: Omit<Restaurant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Restaurant> {
        const response = await apiClient.post<Restaurant>('/restaurants', data)
        RestaurantService.ensureSuccess<Restaurant>(response, 'Failed to create restaurant')
        return response
    }

    // Update restaurant (admin only)
    static async updateRestaurant(id: string, data: Partial<Restaurant>): Promise<Restaurant> {
        const response = await apiClient.put<Restaurant>(`/restaurants/${id}`, data)
        RestaurantService.ensureSuccess<Restaurant>(response, 'Failed to update restaurant')
        return response
    }

    // Delete restaurant (admin only)
    static async deleteRestaurant(id: string): Promise<{ message: string }> {
        const response = await apiClient.delete<{ message: string }>(`/restaurants/${id}`)
        RestaurantService.ensureSuccess<{ message: string }>(response, 'Failed to delete restaurant')
        return response
    }

    // Get restaurant categories
    static async getCategories(restaurantId?: string): Promise<Array<{ category: string; count: number }>> {
        const params = restaurantId ? { restaurantId } : undefined
        const response = await apiClient.get<Array<{ category: string; count: number }>>('/categories', params)
        RestaurantService.ensureSuccess<Array<{ category: string; count: number }>>(response, 'Failed to fetch categories')
        return response
    }

    // Get popular restaurants
    static async getPopularRestaurants(limit: number = 6): Promise<Restaurant[]> {
        const response = await apiClient.get<Restaurant[]>('/restaurants', { limit, minRating: 4.0 })
        RestaurantService.ensureSuccess<Restaurant[]>(response, 'Failed to fetch popular restaurants')
        return response
    }

    // Get nearby restaurants (mock implementation)
    static async getNearbyRestaurants(lat: number, lng: number): Promise<Restaurant[]> {
        // In a real app, you'd use actual geolocation API
        const response = await apiClient.get<Restaurant[]>('/restaurants', { limit: 10, lat, lng })
        RestaurantService.ensureSuccess<Restaurant[]>(response, 'Failed to fetch nearby restaurants')
        return response
    }

    // Debounced version to prevent multiple calls
    static getRestaurantsDebounced = createDebouncedApiCall(
        RestaurantService.getRestaurants,
        200
    )

    private static isApiError(response: unknown): response is ApiResponse {
        return !!response && typeof response === 'object' && 'success' in response && (response as ApiResponse).success === false
    }

    private static ensureSuccess<T>(response: T | ApiResponse, errorMessage: string): asserts response is T {
        if (RestaurantService.isApiError(response)) {
            throw new Error(response.error || errorMessage)
        }
    }
}
