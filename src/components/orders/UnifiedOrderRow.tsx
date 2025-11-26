"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { 
  getStatusConfig, 
  formatCurrency, 
  getOrderActions, 
  isCustomerOrder, 
  isEnterpriseOrder,
  type Order 
} from '@/lib/order-utils'
import { 
  MapPin, 
  Trash2, 
  Eye,
  Truck,
  RotateCcw,
  XCircle
} from 'lucide-react'

interface UnifiedOrderRowProps {
  order: Order
  variant: 'customer' | 'enterprise'
  onViewDetails?: (orderId: string) => void
  onReorder?: (orderId: string) => void
  onTrack?: (orderId: string) => void
  onCancel?: (orderId: string) => void
  onDelete?: (orderId: string) => void
}

export function UnifiedOrderRow({ 
  order, 
  variant, 
  onViewDetails, 
  onReorder, 
  onTrack, 
  onCancel, 
  onDelete 
}: UnifiedOrderRowProps) {
  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon
  const actions = getOrderActions(order)

  // Customer order specific data
  const restaurantName = isCustomerOrder(order) ? order.restaurantName : null
  const customerName = isEnterpriseOrder(order) ? order.customerName : null
  const phoneNumber = isEnterpriseOrder(order) ? order.phoneNumber : null
  const customerAddress = isEnterpriseOrder(order) ? order.customerAddress : null
  const deliveryAddress = order.deliveryAddress
  const displayAddress = deliveryAddress || customerAddress

  // Items data
  const items = isCustomerOrder(order) ? order.items : order.orderDetails
  const itemsCount = isCustomerOrder(order) ? order.items.length : order.items

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 hover:border-purple-300/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex items-center justify-between p-3">
        {/* Left Section - Order Info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">
              {customerName ? customerName.charAt(0).toUpperCase() : '#'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {customerName || `#${order.id.slice(-8)}`}
              </h3>
              <Badge className={`${statusConfig.color} border text-xs px-2 py-1`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
              <span>#{order.id.slice(-6)}</span>
              <span>•</span>
              <span>{itemsCount} items</span>
              {phoneNumber && (
                <>
                  <span>•</span>
                  <span className="text-green-600">📞 {phoneNumber}</span>
                </>
              )}
            </div>

            {/* Restaurant/Customer Info */}
            {restaurantName && (
              <div className="text-xs text-gray-500 mt-0.5">
                🏪 {restaurantName}
              </div>
            )}

            {/* Items Preview */}
            {items.length > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-xs text-gray-400">Items:</span>
                <div className="flex items-center space-x-1">
                  {items.slice(0, 2).map((item, index) => (
                    <span key={index} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                      {'dishName' in item ? item.dishName : item.foodName}×{item.quantity}
                    </span>
                  ))}
                  {items.length > 2 && (
                    <span className="text-xs text-gray-400">+{items.length - 2}</span>
                  )}
                </div>
              </div>
            )}

            {/* Address */}
            {displayAddress && (
              <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                <span className="truncate" title={displayAddress}>
                  {displayAddress}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Section - Amount & Actions */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
            <div className="text-xs text-gray-500">{formatDate(order.createdAt)}</div>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* View Details */}
            {actions.canViewDetails && onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(order.id)}
                className="flex items-center space-x-1 text-xs px-2 py-1 h-6"
                title="View Details"
              >
                <Eye className="w-3 h-3" />
              </Button>
            )}

            {/* Track */}
            {actions.canTrack && onTrack && (
              <Button
                size="sm"
                onClick={() => onTrack(order.id)}
                className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-xs px-2 py-1 h-6"
                title="Track Order"
              >
                <Truck className="w-3 h-3" />
              </Button>
            )}

            {/* Reorder */}
            {actions.canReorder && onReorder && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReorder(order.id)}
                className="flex items-center space-x-1 text-green-600 border-green-200 hover:bg-green-50 text-xs px-2 py-1 h-6"
                title="Reorder"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}

            {/* Cancel */}
            {actions.canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(order.id)}
                className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50 text-xs px-2 py-1 h-6"
                title="Cancel Order"
              >
                <XCircle className="w-3 h-3" />
              </Button>
            )}

            {/* Delete (Enterprise only) */}
            {variant === 'enterprise' && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(order.id)}
                className="flex items-center space-x-1 text-red-600 border-red-200 hover:bg-red-50 text-xs px-2 py-1 h-6"
                title="Delete Order"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

