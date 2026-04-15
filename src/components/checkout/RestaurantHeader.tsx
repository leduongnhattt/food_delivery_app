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

function formatDeliveryTime(deliveryTime: string) {
  const raw = (deliveryTime ?? '').trim()
  if (!raw || raw === '—') return raw || '—'

  const normalized = raw 
    .replace(/\s*-\s*/g, '–') 
    .replace(/\s+/g, ' ')

  return normalized.replace(/\s(min|mins|minute|minutes)\b/i, '\u00A0$1')
}

export function RestaurantHeader({ name, rating, deliveryTime, address, logoUrl }: RestaurantHeaderProps) {
  const displayDeliveryTime = formatDeliveryTime(deliveryTime)

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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium">{rating}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="whitespace-nowrap tabular-nums font-medium">{displayDeliveryTime}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600 min-w-0">
                <MapPin className="w-4 h-4" />
                <span className="min-w-0 break-words">{address}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


