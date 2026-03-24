import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Star } from 'lucide-react';
import { RestaurantCardData } from '@/types/models';

interface Props {
  restaurant: RestaurantCardData;
  showRating?: boolean;
  showDescription?: boolean;
}

const RestaurantCard: React.FC<Props> = ({ 
  restaurant, 
  showRating = true,
  showDescription = true 
}) => {
  const rating = restaurant.rating ?? 0;
  const totalReviews = restaurant.totalReviews ?? 0;
  
  // Calculate star display
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <Link href={`/restaurants/${restaurant.enterpriseId}`} className="block">
      <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
      {/* Restaurant Image */}
      <div className="relative h-48 overflow-hidden">
        {restaurant.avatarUrl ? (
          <Image
            src={restaurant.avatarUrl}
            alt={restaurant.enterpriseName}
            width={400}
            height={192}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-2">🍽️</div>
              <div className="text-2xl font-bold">{restaurant.enterpriseName.charAt(0)}</div>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
              restaurant.status === "open"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {restaurant.status === "open" ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {restaurant.enterpriseName}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1 flex items-center">
            <span className="mr-1">📍</span>
            {restaurant.address}
          </p>
        </div>

        {showDescription && restaurant.description && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {restaurant.description}
          </p>
        )}

        {showRating && (
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, index) => {
                if (index < fullStars) {
                  return <Star key={index} className="w-4 h-4 text-yellow-400 fill-current" />;
                } else if (index === fullStars && hasHalfStar) {
                  return (
                    <div key={index} className="relative w-4 h-4">
                      <Star className="w-4 h-4 text-gray-300 absolute" />
                      <Star className="w-4 h-4 text-yellow-400 fill-current absolute" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                    </div>
                  );
                } else {
                  return <Star key={index} className="w-4 h-4 text-gray-300" />;
                }
              })}
            </div>
            {rating > 0 && (
              <>
                <span className="text-sm text-gray-600 ml-2 font-medium">{rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400 ml-1">({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})</span>
              </>
            )}
            {rating === 0 && totalReviews === 0 && (
              <span className="text-xs text-gray-400 ml-2">No reviews yet</span>
            )}
          </div>
        )}

        {/* Delivery Info */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-1">⏱️</span>
            <span className="font-medium">30-45 min</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-1">🚚</span>
            <span className="font-medium">Free</span>
          </div>
        </div>
      </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
