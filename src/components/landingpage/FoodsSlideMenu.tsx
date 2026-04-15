import React from 'react';
import { useRouter } from 'next/navigation';
import FoodCard from './FoodCard';
import { usePopularFoods } from '@/hooks/use-popular-foods';
import { CATALOG_REFETCH_INTERVAL_MS } from '@/hooks/catalog-refetch';
import { SAMPLE_FOODS } from '@/data/sample-foods';
import { Food, RestaurantModalInfo, ApiRestaurantPayload, FoodsSlideMenuProps } from '@/types/models';
import { OrderModal } from '@/components/ui/order-modal';
import { getRestaurantById } from '@/data/sample-restaurants';
import { Loading } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';

// moved to types/models.ts -> FoodsSlideMenuProps


const FoodsSlideMenu: React.FC<FoodsSlideMenuProps> = ({ 
  title = "Popular Dishes", 
  foods, 
  onOrderFood,
  className = "",
  useDatabase = false,
  restaurantId,
  category,
  limit = 10
}) => {
  const router = useRouter();
  const [selectedFood, setSelectedFood] = React.useState<Food | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  
  // Fetch foods from database if useDatabase is true
  const { 
    foods: databaseFoods, 
    loading, 
    error 
  } = usePopularFoods(
    { restaurantId, category, limit },
    {
      enabled: useDatabase,
      refetchIntervalMs: useDatabase ? CATALOG_REFETCH_INTERVAL_MS : 0,
      refetchOnVisibility: useDatabase,
    },
  );
  
  // Resolve restaurant info for the OrderModal from multiple possible sources
  const resolveRestaurantInfo = (food: Food): RestaurantModalInfo => {
    const enriched = food as Food & Partial<ApiRestaurantPayload>

    // Prefer data embedded from DB responses
    if (enriched.restaurant && (enriched.restaurant.name || enriched.restaurant.id)) {
      return {
        id: enriched.restaurant.id ?? food.restaurantId,
        name: enriched.restaurant.name ?? 'Restaurant',
        rating: enriched.restaurant.rating ?? 4.5,
        deliveryTime: enriched.restaurant.deliveryTime ?? '30-45 min',
        logo: enriched.restaurant.avatarUrl ?? null,
      }
    }

    if (enriched.enterprise && (enriched.enterprise.EnterpriseName || enriched.enterprise.Avatar)) {
      return {
        id: food.restaurantId,
        name: enriched.enterprise.EnterpriseName ?? 'Restaurant',
        rating: 4.5,
        deliveryTime: '30-45 min',
        logo: enriched.enterprise.Avatar ?? null,
      }
    }

    // Fallback to local sample data for non-DB items
    const fallback = getRestaurantById(food.restaurantId)
    if (fallback) {
      return {
        id: fallback.id,
        name: fallback.name,
        rating: fallback.rating,
        deliveryTime: fallback.deliveryTime,
        logo: fallback.avatarUrl,
      }
    }

    return { id: food.restaurantId, name: 'Restaurant', rating: 4.5, deliveryTime: '30-45 min', logo: null }
  }

  // Determine which foods to display
  const displayFoods = React.useMemo(() => {
    if (useDatabase) {
      return databaseFoods;
    }
    return foods && foods.length > 0 ? foods : SAMPLE_FOODS;
  }, [useDatabase, databaseFoods, foods]);

  const visibleFoods = React.useMemo(() => {
    if (expanded) return displayFoods;
    // Default: show 8 items (4x2 on desktop).
    return displayFoods.slice(0, 8);
  }, [displayFoods, expanded]);

  const handleOrderFood = (foodId: string): void => {
    // Find the food item to get restaurantId
    const foodItem = displayFoods.find(food => food.foodId === foodId);
    
    if (foodItem) {
      // Open modal instead of direct navigation
      setSelectedFood(foodItem);
      setIsModalOpen(true);
    } else {
      // Fallback: call the original onOrderFood function
      console.log('Ordering food:', foodId);
      onOrderFood(foodId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedFood(null);
  };

  React.useEffect(() => {
    // Reset view-more when filtering changes
    setExpanded(false);
  }, [category, restaurantId, useDatabase]);

  // Show loading state
  if (useDatabase && loading) {
    return (
      <div className={`relative w-full overflow-hidden ${className}`} style={{ minWidth: '0' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 px-2 sm:px-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
            {title}
          </h2>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loading />
        </div>
      </div>
    );
  }

  // Show error state
  if (useDatabase && error) {
    return (
      <div className={`relative w-full overflow-hidden ${className}`} style={{ minWidth: '0' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 px-2 sm:px-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
            {title}
          </h2>
        </div>
        <div className="flex justify-center items-center py-8">
          <ErrorDisplay 
            error={error}
            onClose={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ minWidth: '0' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 px-2 sm:px-0">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">
          {title}
        </h2>

        {/* Right action: View full menu (if restaurantId) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {restaurantId && (
            <button
              onClick={() => router.push(`/restaurants/${restaurantId}`)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              View full menu
            </button>
          )}
        </div>
      </div>

      {/* Foods Grid */}
      <div className="px-2 sm:px-0">
        <div className="max-w-6xl mx-auto">
          {visibleFoods.length === 0 ? (
            <div className="py-6 text-center">
              <div className="text-sm font-semibold text-gray-900">
                No dishes found{category ? ` in “${category}”` : ''}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Try another category to see more dishes.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visibleFoods.map((food) => (
                <FoodCard
                  key={food.foodId}
                  food={food}
                  onOrderNow={handleOrderFood}
                />
              ))}
            </div>
          )}
        </div>

        {displayFoods.length > 8 && visibleFoods.length > 0 ? (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="px-6 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:shadow-sm transition"
            >
              {expanded ? 'View less' : 'View more'}
            </button>
          </div>
        ) : null}
      </div>

      {/* Order Modal */}
      {selectedFood && (
        <OrderModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          food={selectedFood}
          restaurant={resolveRestaurantInfo(selectedFood)}
        />
      )}
    </div>
  );
};

export default FoodsSlideMenu;
