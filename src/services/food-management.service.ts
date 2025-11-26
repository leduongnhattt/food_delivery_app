import { apiClient } from "./api";

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
        const response = await apiClient.post("/enterprise/food", foodData) as any;

        if (response.success === false) {
            throw new Error(response.error || "Failed to create food item");
        }
    }

    /**
     * Get all available food categories
     */
    async getCategories(): Promise<Category[]> {
        const response = await apiClient.get<{ categories: Category[] }>("/enterprise/category") as any;

        if (response.success === false) {
            throw new Error(response.error || "Failed to fetch categories");
        }

        return response.categories;
    }
}

// Export singleton instance
export const foodManagementService = new FoodManagementServiceImpl();
