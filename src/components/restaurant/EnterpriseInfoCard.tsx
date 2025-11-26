"use client"
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Clock, Phone, MapPin } from 'lucide-react'

interface Props {
  isOpen: boolean
  rating: number
  phone: string
  address: string
  deliveryTime: string
  description?: string
}

export default function EnterpriseInfoCard({ isOpen, rating, phone, address, deliveryTime, description }: Props) {
  return (
    <Card className="mb-8 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className={isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
              {isOpen ? 'Open' : 'Closed'}
            </Badge>
            <div className="flex items-center gap-2 text-gray-800">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{rating}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { window.location.href = `tel:${phone}` }}>
              Call
            </Button>
            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => {
              const q = encodeURIComponent(address)
              window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank')
            }}>
              Directions
            </Button>
            <Button size="sm" variant="secondary" className="rounded-full" onClick={() => {
              const el = document.getElementById('reviews')
              el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}>
              Reviews
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Delivery Time</p>
              <p className="text-sm text-gray-600">{deliveryTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Open Hours</p>
              <p className="text-sm text-gray-600">{deliveryTime}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Phone</p>
              <p className="text-sm text-gray-600">{phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:col-span-1">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Address</p>
              <p className="text-sm text-gray-600">{address}</p>
            </div>
          </div>
        </div>

        {description && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


