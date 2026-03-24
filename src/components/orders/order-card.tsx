"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { Order } from '@/services/order.service'
import { 
  Clock, 
  MapPin, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Eye
} from 'lucide-react'
import { useState } from 'react'

interface OrderCardProps {
  order: Order
  onViewDetails: (orderId: string) => void
  onReorder: (orderId: string) => void
  onTrack: (orderId: string) => void
  onCancel: (orderId: string) => void
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: Clock,
        label: 'Pending'
      }
    case 'confirmed':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Package,
        label: 'Confirmed'
      }
    case 'preparing':
      return {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: Package,
        label: 'Preparing'
      }
    case 'out_for_delivery':
      return {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Truck,
        label: 'Out for Delivery'
      }
    case 'delivered':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Delivered'
      }
    case 'cancelled':
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        label: 'Cancelled'
      }
    default:
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Clock,
        label: status
      }
  }
}

export function OrderCard({ order, onViewDetails, onReorder, onTrack, onCancel }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const canTrack = ['preparing', 'out_for_delivery'].includes(order.status)
  const canReorder = order.status === 'delivered'

  return (
    <Card className="hover:shadow-md transition-all duration-200 border border-gray-200 bg-white h-full">
      <CardContent className="p-4 flex flex-col h-full min-h-[200px]">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Package className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">#{order.id.slice(-8)}</h3>
              <p className="text-xs text-gray-500">{order.restaurantName}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={`${statusConfig.color} border text-xs px-2 py-1`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <p className="text-sm font-bold text-orange-600 mt-1">{formatPrice(order.totalAmount)}</p>
          </div>
        </div>

        {/* Date & Location */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-24">{order.deliveryAddress}</span>
            </div>
          </div>
        </div>

        {/* Items Preview */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">Items ({order.items.length})</span>
            {order.items.length > 1 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-orange-600 hover:text-orange-700"
              >
                {isExpanded ? 'Less' : 'All'}
              </button>
            )}
          </div>
          
          <div className="space-y-1">
            {order.items.slice(0, isExpanded ? order.items.length : 1).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                    {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">{item.foodName}</span>
                </div>
                <span className="font-medium text-gray-700">{formatPrice(item.price)}</span>
              </div>
            ))}
            
            {!isExpanded && order.items.length > 1 && (
              <div className="text-xs text-gray-500 text-center py-1">
                +{order.items.length - 1} more items
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto flex gap-2 pt-3 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(order.id)}
            className="flex items-center space-x-1 text-xs px-3 py-1 h-7"
          >
            <Eye className="w-3 h-3" />
            <span>Details</span>
          </Button>

          {canTrack && (
            <Button
              size="sm"
              onClick={() => onTrack(order.id)}
              className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-xs px-3 py-1 h-7"
            >
              <Truck className="w-3 h-3" />
              <span>Track</span>
            </Button>
          )}

          {canReorder && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReorder(order.id)}
              className="flex items-center space-x-1 text-green-600 border-green-200 hover:bg-green-50 text-xs px-3 py-1 h-7"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reorder</span>
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(order.id)}
              className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50 text-xs px-3 py-1 h-7"
            >
              <XCircle className="w-3 h-3" />
              <span>Cancel</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
