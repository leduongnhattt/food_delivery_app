'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Truck } from 'lucide-react'

interface DeliveryFormProps {
  phone: string
  address: string
  isLoading?: boolean
}

export function DeliveryForm({ phone, address, isLoading = false }: DeliveryFormProps) {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-500" />
          Delivery Information
          {isLoading && (
            <div className="ml-auto">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Phone Number</label>
          <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
            {phone || 'Not provided'}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Delivery Address</label>
          <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700">
            {address || 'Not provided'}
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          <p>To update your delivery information, please go to your <a href="/profile" className="text-orange-500 hover:text-orange-600 underline">profile page</a>.</p>
        </div>
      </CardContent>
    </Card>
  )
}


