import { getServerApiBase, requestJson } from "@/lib/http-client";

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
