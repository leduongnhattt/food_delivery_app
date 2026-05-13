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
  const descriptionText = (restaurant.description ?? '').trim();
  
  return (
    <Link
      href={`/restaurants/${restaurant.enterpriseId}`}
      className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2"
    >
      <div className="group/card flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
      {/* Restaurant Image — fixed height so every card matches */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-gray-100">
        {restaurant.avatarUrl ? (
          <Image
            src={restaurant.avatarUrl}
            alt={restaurant.enterpriseName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
            <div className="text-center text-white">
              <div className="mb-2 text-4xl">🍽️</div>
              <div className="text-2xl font-bold">{restaurant.enterpriseName.charAt(0)}</div>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
              restaurant.status === "open"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {restaurant.status === "open" ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {/* Body: flex column fills row height; footer pinned with mt-auto */}
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <h3 className="line-clamp-1 text-lg font-bold text-gray-900 transition-colors group-hover/card:text-orange-600">
            {restaurant.enterpriseName}
          </h3>
          <p className="flex min-h-[2.5rem] items-start text-sm leading-5 text-gray-600">
            <span className="mr-1 shrink-0">📍</span>
            <span className="min-w-0 line-clamp-2">{restaurant.address}</span>
          </p>

          {showDescription ? (
            <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-gray-500">
              {descriptionText.length > 0 ? descriptionText : '\u00a0'}
            </p>
          ) : null}

          {showRating ? (
            <div className="flex min-h-[1.75rem] shrink-0 flex-nowrap items-center gap-x-1 overflow-hidden">
              <div className="flex shrink-0 items-center">
                {[...Array(5)].map((_, index) => {
                  if (index < fullStars) {
                    return <Star key={index} className="h-4 w-4 fill-current text-yellow-400" />;
                  } else if (index === fullStars && hasHalfStar) {
                    return (
                      <div key={index} className="relative h-4 w-4">
                        <Star className="absolute h-4 w-4 text-gray-300" />
                        <Star className="absolute h-4 w-4 fill-current text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                      </div>
                    );
                  } else {
                    return <Star key={index} className="h-4 w-4 text-gray-300" />;
                  }
                })}
              </div>
              {rating > 0 && (
                <span className="min-w-0 truncate text-sm font-medium text-gray-600">
                  {rating.toFixed(1)}
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </span>
              )}
              {rating === 0 && totalReviews === 0 && (
                <span className="shrink-0 text-xs text-gray-400">No reviews yet</span>
              )}
            </div>
          ) : null}
        </div>

        {/* Delivery Info */}
        <div className="mt-auto flex shrink-0 items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-1">⏱️</span>
            <span className="font-medium">{restaurant.deliveryTime || '30-45 min'}</span>
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
