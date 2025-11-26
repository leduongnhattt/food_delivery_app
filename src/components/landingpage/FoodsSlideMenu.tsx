import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import FoodCard from './FoodCard';
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll';
import { useResponsiveCardSizes } from '@/hooks/use-responsive-card-sizes';
import { useScrollIndicators } from '@/hooks/use-scroll-indicators';
import { usePopularFoods } from '@/hooks/use-popular-foods';
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
  
  // Fetch foods from database if useDatabase is true
  const { 
    foods: databaseFoods, 
    loading, 
    error 
  } = usePopularFoods({
    restaurantId,
    category,
    limit
  });
  
  // Use custom hooks for scroll functionality
  const {
    scrollContainerRef,
    showLeftArrow,
    showRightArrow,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    scroll
  } = useHorizontalScroll({
    momentumMultiplier: 300,
    velocityThreshold: 0.5,
    dragMultiplier: 1.5
  });

  // Use responsive card sizes hook
  const { getCardSizeClasses } = useResponsiveCardSizes();

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

  // Use scroll indicators hook
  const { generateDots, shouldShowIndicators } = useScrollIndicators({
    totalItems: displayFoods.length,
    itemsPerPage: 2,
    isMobile: true
  });

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

  // Show loading state
  if (useDatabase && loading) {
    return (
      <div className={`relative w-full overflow-hidden ${className}`} style={{ minWidth: '0' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 px-2 sm:px-0">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 truncate">
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
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 truncate">
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
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 truncate">
          {title}
        </h2>

        {/* Right actions: View full menu (if restaurantId) + navigation arrows */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {restaurantId && (
            <button
              onClick={() => router.push(`/restaurants/${restaurantId}`)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              View full menu
            </button>
          )}
          
          {/* Navigation Buttons */}
          <div className="flex gap-1 sm:gap-2">
          <button 
            onClick={() => scroll('left')}
            className={`p-1.5 sm:p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:scale-[1.1] sm:hover:scale-[1.2] transition-all duration-200 border border-gray-200 ${
              !showLeftArrow ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!showLeftArrow}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => scroll('right')}
            className={`p-1.5 sm:p-2 rounded-full bg-white shadow-md hover:shadow-lg hover:scale-[1.1] sm:hover:scale-[1.2] transition-all duration-200 border border-gray-200 ${
              !showRightArrow ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!showRightArrow}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
          </button>
          </div>
        </div>
      </div>

      {/* Foods Slider - Single Row */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2 sm:pb-4 cursor-grab select-none px-2 sm:px-0"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {displayFoods.map((food) => (
          <div 
            key={food.foodId}
            className={`flex-shrink-0 ${getCardSizeClasses()}`}
          >
            <FoodCard 
              food={food} 
              onOrderNow={handleOrderFood}
            />
          </div>
        ))}
      </div>

      {/* Scroll indicator dots for mobile */}
      {shouldShowIndicators && (
        <div className="flex justify-center mt-3 sm:mt-4 sm:hidden px-2">
          <div className="flex gap-1.5 sm:gap-2">
            {generateDots().map((dot) => (
              <div
                key={dot.index}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-200 ${
                  dot.isActive ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      )}

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
