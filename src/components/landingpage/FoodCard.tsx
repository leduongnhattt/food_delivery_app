import React from 'react';
import Image from 'next/image';
import { Food } from '@/types/models';
import { formatPrice } from '@/lib/utils';
import { HighlightText } from '@/components/ui/highlight-text';

interface FoodCardProps {
  food: Food;
  onOrderNow: (foodId: string) => void;
  searchQuery?: string;
}

const FoodCard: React.FC<FoodCardProps> = ({ food, onOrderNow, searchQuery = '' }) => {
  const handleOrderClick = (): void => {
    onOrderNow(food.foodId);
  };

  // Defensive availability: prefer explicit isAvailable; fallback to true (do not infer from stock)
  const availableFlag = (food as any)?.isAvailable
  const available = (availableFlag !== undefined) ? Boolean(availableFlag) : true

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden min-w-[280px] max-w-[300px] flex-shrink-0 hover:shadow-xl transition-shadow duration-300">
      {/* Food Image */}
      <div className="relative h-48 overflow-hidden">
        {food.imageUrl ? (
          <Image 
            src={food.imageUrl}
            alt={food.dishName || 'Food item'}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs" style={{ aspectRatio: "1 / 1" }}>
            No Image
          </div>
        )}
        {/* No stock hint badge; availability is controlled by flag */}
        {!available && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
        Out of Stock
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Food Name */}
        <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
          <HighlightText 
            text={food.dishName} 
            searchQuery={searchQuery}
          />
        </h3>

        {/* Category and Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {food.menu?.category || 'Food'}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[40px]">
          {food.description}
        </p>

        {/* Price and Order Button */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-800">
            {formatPrice(food.price)}
          </span>
          <button 
            onClick={handleOrderClick}
            disabled={!available}
            className={`px-6 py-2 rounded-full font-medium text-sm transition-colors duration-200 ${
              !available 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {!available ? 'Sold Out' : 'Order Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodCard;