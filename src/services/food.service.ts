import { Food } from '@/types/models'
import { BaseService, buildQueryString, getServerApiBase, requestJson, createDebouncedApiCall } from '@/lib/http'
import { API_BASE_URL } from '@/services/api'

/** Base URL for foods APIs, derived from the shared API_BASE_URL. */
function getFoodsApiBase(): string {
    return `${API_BASE_URL}/foods`
}

const GET_OPTIONS: RequestInit = { method: 'GET', cache: 'no-store' }

export interface PopularFoodsResponse {
    foods: Food[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

const EMPTY_POPULAR_RESPONSE: PopularFoodsResponse = {
    foods: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
}

export interface FoodServiceFilters {
    limit?: number
    page?: number
    restaurantId?: string
    category?: string
    search?: string
    isAvailable?: boolean
}

export interface FoodByIdItem {
    id: string
    name: string
    price: number
    imageUrl: string
    restaurantId: string
    category?: string
    description?: string
    restaurantName?: string
}

export class FoodService extends BaseService {
    constructor() {
        super(getFoodsApiBase())
    }

    private static async fetchList(path: string, filters: FoodServiceFilters): Promise<PopularFoodsResponse> {
        const queryString = buildQueryString(filters)
        const url = `${getFoodsApiBase()}${path}${queryString ? `?${queryString}` : ''}`
        return requestJson<PopularFoodsResponse>(url, GET_OPTIONS)
    }

    static async getPopularFoods(filters: FoodServiceFilters = {}): Promise<PopularFoodsResponse> {
        try {
            return await FoodService.fetchList('/popular', filters)
        } catch (error) {
            console.error('Error fetching popular foods:', error)
            return EMPTY_POPULAR_RESPONSE
        }
    }

    static async getAllFoods(filters: FoodServiceFilters = {}): Promise<PopularFoodsResponse> {
        try {
            return await FoodService.fetchList('', filters)
        } catch (error) {
            console.error('Error fetching foods:', error)
            return EMPTY_POPULAR_RESPONSE
        }
    }

    static getFoodsByRestaurant(restaurantId: string, limit?: number): Promise<PopularFoodsResponse> {
        return this.getPopularFoods({ restaurantId, limit })
    }

    static getFoodsByCategory(category: string, limit?: number): Promise<PopularFoodsResponse> {
        return this.getPopularFoods({ category, limit })
    }

    static async getFoodsByIds(ids: string[]): Promise<FoodByIdItem[]> {
        if (!ids.length) return []

        try {
            const response = await requestJson<{ foods: FoodByIdItem[] }>(`${getFoodsApiBase()}/by-ids`, {
                method: 'POST',
                body: JSON.stringify({ ids }),
                cache: 'no-store',
            })
            return response.foods ?? []
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

// ==== food-management.service.ts ====

export interface CreateFoodData {
    DishName: string;
    Description?: string;
    Price: number;
    Stock: number;
    ImageURL?: string;
    FoodCategoryID: string;
}

export interface Category {
    CategoryID: string;
    CategoryName: string;
    Description?: string;
}

export interface FoodManagementService {
    createFood: (foodData: CreateFoodData) => Promise<void>;
    getCategories: () => Promise<Category[]>;
}

class FoodManagementServiceImpl implements FoodManagementService {
    /**
     * Create a new food item
     */
    async createFood(foodData: CreateFoodData): Promise<void> {
        const base = getServerApiBase();
        await requestJson(`${base}/enterprise/food`, {
            method: "POST",
            body: JSON.stringify(foodData),
            cache: "no-store",
        });
    }

    /**
     * Get all available food categories
     */
    async getCategories(): Promise<Category[]> {
        const base = getServerApiBase();
        const response = await requestJson<{ categories: Category[] }>(`${base}/enterprise/category`, {
            method: "GET",
            cache: "no-store",
        });
        return response.categories;
    }
}

// Export singleton instance
export const foodManagementService = new FoodManagementServiceImpl();
