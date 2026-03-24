'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, MapPin, Star } from 'lucide-react'
import Image from 'next/image'

interface RestaurantHeaderProps {
  name: string
  rating: number | string
  deliveryTime: string
  address: string
  logoUrl?: string | null
}

export function RestaurantHeader({ name, rating, deliveryTime, address, logoUrl }: RestaurantHeaderProps) {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-orange-100 to-red-100">
            {logoUrl ? (
              <Image src={logoUrl} alt="Restaurant logo" width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <span className="text-2xl">🍽️</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{name}</h3>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{rating}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{deliveryTime}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{address}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


