import type { Restaurant, MenuItem } from '@/types/models'

// Map API Restaurant (already in correct shape) to VM
export function mapRestaurantToVM(api: Restaurant): Restaurant {
    return api
}

// Map Food API item (from /api/foods) to MenuItem VM
export function mapFoodToMenuItem(food: any): MenuItem {
    return {
        id: food.foodId,
        name: food.dishName,
        description: food.description,
        // Keep price in USD as provided by API (supports decimals like 8.5)
        price: Math.round(((food.price ?? 0) as number) * 100) / 100,
        image: food.imageUrl || '/api/placeholder/300/200',
        category: food.menu?.category ?? 'Others',
        // Prefer IsAvailable flag; fallback to stock semantics if API item still provides it
        isAvailable: Boolean(
            (food.isAvailable ?? food.IsAvailable) !== undefined
                ? (food.isAvailable ?? food.IsAvailable)
                : (food.stock ?? 0) > 0
        ),
        restaurantId: food.restaurantId,
        restaurantName: (
            food.restaurant?.name ||
            food.restaurantName ||
            food.enterprise?.EnterpriseName ||
            food.restaurant?.EnterpriseName ||
            null
        ) || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
}


