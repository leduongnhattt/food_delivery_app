import { Food } from '@/types/models'
import { BaseService } from '@/lib/base-service'
import { buildQueryString, requestJson } from '@/lib/http-client'
import { createDebouncedApiCall } from '@/lib/debounce'

export interface PopularFoodsResponse {
    foods: Food[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface FoodServiceFilters {
    limit?: number
    page?: number
    restaurantId?: string
    category?: string
    search?: string
    isAvailable?: boolean
}

export class FoodService extends BaseService {
    constructor() {
        super('/api/foods')
    }

    /**
     * Fetch popular foods from the database
     */
    static async getPopularFoods(filters: FoodServiceFilters = {}): Promise<PopularFoodsResponse> {
        try {
            const queryString = buildQueryString(filters)
            const url = `/api/foods/popular${queryString ? `?${queryString}` : ''}`

            const response = await requestJson<PopularFoodsResponse>(url, {
                method: 'GET',
                cache: 'no-store'
            })

            return response
        } catch (error) {
            console.error('Error fetching popular foods:', error)
            return {
                foods: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0
                }
            }
        }
    }

    /**
     * Fetch all foods with filters
     */
    static async getAllFoods(filters: FoodServiceFilters = {}): Promise<PopularFoodsResponse> {
        try {
            const queryString = buildQueryString(filters)
            const url = `/api/foods${queryString ? `?${queryString}` : ''}`

            const response = await requestJson<PopularFoodsResponse>(url, {
                method: 'GET',
                cache: 'no-store'
            })

            return response
        } catch (error) {
            console.error('Error fetching foods:', error)
            return {
                foods: [],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPages: 0
                }
            }
        }
    }

    /**
     * Fetch foods by restaurant ID
     */
    static async getFoodsByRestaurant(restaurantId: string, limit?: number): Promise<PopularFoodsResponse> {
        return this.getPopularFoods({ restaurantId, limit })
    }

    /**
     * Fetch foods by category
     */
    static async getFoodsByCategory(category: string, limit?: number): Promise<PopularFoodsResponse> {
        return this.getPopularFoods({ category, limit })
    }

    static async getFoodsByIds(ids: string[]): Promise<Array<{ id: string, name: string, price: number, imageUrl: string, restaurantId: string, category?: string, description?: string, restaurantName?: string }>> {
        if (!ids.length) return []

        try {
            const response = await requestJson<{ foods: any[] }>('/api/foods/by-ids', {
                method: 'POST',
                body: JSON.stringify({ ids }),
                cache: 'no-store'
            })
            return response.foods || []
        } catch (error) {
            console.error('Error fetching foods by IDs:', error)
            return []
        }
    }

    // Debounced version to prevent multiple calls
    static getFoodsByIdsDebounced = createDebouncedApiCall(
        FoodService.getFoodsByIds,
        200
    )

    // Debounced version for popular foods
    static getPopularFoodsDebounced = createDebouncedApiCall(
        FoodService.getPopularFoods,
        200
    )
}
