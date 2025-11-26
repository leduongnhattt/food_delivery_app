import React from "react";
import RestaurantCard from "./RestaurantCard";
import { useRestaurantList } from '@/hooks/use-restaurant-list';
import { Loading } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';
import { Restaurant as ApiRestaurant, RestaurantCardData } from '@/types/models';

// Transform API data to match RestaurantCard interface
const transformRestaurantForCard = (restaurant: ApiRestaurant): RestaurantCardData => ({
  enterpriseId: restaurant.id,
  accountId: '', // Not needed for display
  enterpriseName: restaurant.name,
  address: restaurant.address,
  description: restaurant.description,
  avatarUrl: restaurant.avatarUrl,
  status: restaurant.isOpen ? "open" : "closed" as "open" | "closed"
});

interface Props {
  className?: string;
  limit?: number;
  showViewAll?: boolean;
}

const RestaurantMenu: React.FC<Props> = ({ 
  className = "",
  limit = 8,
  showViewAll = true 
}) => {
  const [displayLimit, setDisplayLimit] = React.useState<number>(limit);
  const [expanded, setExpanded] = React.useState<boolean>(false);
  
  // Use the restaurants hook with filters
  const { 
    restaurants, 
    loading, 
    error, 
    refetch 
  } = useRestaurantList({
    limit: Math.min(displayLimit, 100),
    isOpen: true, // Only show open restaurants
    // minRating: 3.0 // Removed this filter since all restaurants have rating 0
  });


  const handleViewAll = () => {
    // Expand inline instead of navigating
    if (!expanded) {
      setDisplayLimit(100); // API limit cap
      setExpanded(true);
      // Optionally refetch to get more
      refetch();
    } else {
      setDisplayLimit(limit);
      setExpanded(false);
      refetch();
    }
  };

  const handleRetry = () => {
    refetch();
  };

  // Show loading state
  if (loading) {
    return (
      <div className={className}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          🍽️ Popular Restaurants
        </h1>
        <div className="flex justify-center items-center py-8">
          <Loading />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          🍽️ Popular Restaurants
        </h1>
        <div className="flex justify-center items-center py-8">
          <ErrorDisplay 
            error={error}
            onClose={handleRetry}
          />
        </div>
      </div>
    );
  }

  // Show empty state
  if (!restaurants || restaurants.length === 0) {
    return (
      <div className={className}>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          🍽️ Popular Restaurants
        </h1>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No restaurants available at the moment.</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          🍽️ Popular Restaurants
        </h1>
        <div className="text-sm text-gray-600 mt-2 sm:mt-0">
          {restaurants.length} restaurants available
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {restaurants.map((restaurant) => (
          <RestaurantCard 
            key={restaurant.id} 
            restaurant={transformRestaurantForCard(restaurant)}
            showRating={true}
            showDescription={true}
          />
        ))}
      </div>
      
      {showViewAll && restaurants && restaurants.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleViewAll} 
            className="group px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:-translate-y-1"
          >
            <span className="flex items-center">
              {expanded ? 'Show less' : 'View all restaurants'}
              <span className="ml-2 inline-block transform transition-transform group-hover:translate-x-1">
                {expanded ? '↑' : '→'}
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;
