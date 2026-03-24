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
      <div className="relative h-48 w-full">
        <Image
          src={restaurant.avatarUrl}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Closed</span>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {restaurant.description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-medium">{restaurant.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {restaurant.deliveryTime}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Min. order: {formatPrice(restaurant.minimumOrder)}
          </span>
          <span className="text-sm text-muted-foreground">
            {restaurant.address}
          </span>
        </div>
        
        <Link href={`/restaurants/${restaurant.id}`}>
          <Button className="w-full" disabled={!restaurant.isOpen}>
            {restaurant.isOpen ? 'View Menu' : 'Currently Closed'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
