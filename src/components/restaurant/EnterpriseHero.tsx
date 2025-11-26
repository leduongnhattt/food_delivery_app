"use client"
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Star, Heart, MapPin, Clock, Phone, Navigation, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  name: string
  description: string
  avatarUrl: string
  rating: number
  isOpen: boolean
  phone?: string
  address?: string
  deliveryTime?: string
  openHours?: string
  closeHours?: string
}

export default function EnterpriseHero({ name, description, avatarUrl, rating, isOpen, phone, address, deliveryTime, openHours, closeHours }: Props) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back to home placed within hero context */}
        <div className="mb-4">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 rounded-full px-3 py-1.5 bg-white/80 backdrop-blur shadow-sm ring-1 ring-gray-200 hover:ring-gray-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side - Vertical Image */}
            <div className="lg:w-1/3 relative h-64 lg:h-auto">
              <div className="absolute inset-4 rounded-xl overflow-hidden border-4 border-white shadow-lg">
                <Image 
                  src={avatarUrl} 
                  alt={name} 
                  fill 
                  className="object-cover" 
                  priority 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              
              {/* Status and Action Buttons */}
              <div className="absolute top-6 right-6 flex gap-2">
                <Badge 
                  variant="secondary" 
                  className={`px-3 py-1 text-sm font-semibold ${
                    isOpen 
                      ? 'bg-green-500 text-white border-green-600' 
                      : 'bg-red-500 text-white border-red-600'
                  }`}
                >
                  {isOpen ? 'Open' : 'Closed'}
                </Badge>
                <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white shadow-md">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="lg:w-2/3 p-6 md:p-8">
              <div className="flex flex-col h-full">
                {/* Top Section - Rating and Name */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-lg">{rating}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-300" />
                    <span className="text-gray-600 text-sm">4.2 (128 reviews)</span>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    {name}
                  </h1>
                  
                  <p className="text-gray-600 text-base leading-relaxed">
                    {description}
                  </p>
                </div>


                {/* Bottom Section - Info Cards and Action Buttons */}
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mt-auto">
                  {/* Info Cards */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-xs text-gray-500">Delivery</p>
                        <p className="text-sm font-semibold">{deliveryTime || '30-45 min'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-xs text-gray-500">Hours</p>
                        <p className="text-sm font-semibold">{openHours && closeHours ? `${openHours}-${closeHours}` : '8:00-22:00'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-semibold">{phone || '+84 555 123 456'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-semibold">{address || '411 - Điện Biên Phủ - Đà Nẵng'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold"
                      onClick={() => window.open(`tel:${phone || '+84 555 123 456'}`, '_self')}
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-2 border-orange-500 text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-lg font-semibold"
                      onClick={() => {
                        const restaurantAddress = encodeURIComponent(address || '411 - Điện Biên Phủ - Đà Nẵng')
                        window.open(`https://www.google.com/maps/search/?api=1&query=${restaurantAddress}`, '_blank')
                      }}
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Directions
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold"
                      onClick={() => {
                        // Scroll to reviews section
                        const reviewsSection = document.getElementById('reviews')
                        if (reviewsSection) {
                          reviewsSection.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                    >
                      <Star className="w-4 h-4 mr-1" />
                      Reviews
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


