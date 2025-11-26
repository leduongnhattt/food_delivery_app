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
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-gray-300" />
            </div>
            <span className="text-sm text-gray-600 ml-2 font-medium">4.2</span>
            <span className="text-xs text-gray-400 ml-1">(128 reviews)</span>
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
