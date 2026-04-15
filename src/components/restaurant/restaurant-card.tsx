import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { Restaurant } from '@/types/models'

interface RestaurantCardProps {
  restaurant: Restaurant
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40 w-full">
        <Image
          src={restaurant.avatarUrl}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
        {restaurant.isOpen && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              Open
            </span>
          </div>
        )}
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Closed</span>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{restaurant.name}</CardTitle>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {restaurant.description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500">★</span>
            <span className="text-xs font-medium">{restaurant.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {restaurant.deliveryTime}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">
            Min. order: {formatPrice(restaurant.minimumOrder)}
          </span>
          <span className="text-xs text-muted-foreground">
            {restaurant.address}
          </span>
        </div>
        
        <Link href={`/restaurants/${restaurant.id}`}>
          <Button className="w-full h-8 text-xs" disabled={!restaurant.isOpen}>
            {restaurant.isOpen ? 'View Menu' : 'Currently Closed'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
