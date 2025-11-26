"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { Order } from '@/services/order.service'
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

interface OrderRowProps {
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

export function OrderRow({ order, onViewDetails, onReorder, onTrack, onCancel }: OrderRowProps) {
  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const canTrack = ['preparing', 'out_for_delivery'].includes(order.status)
  const canReorder = order.status === 'delivered'

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
        {/* Order Info */}
        <td className="px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">#{order.id.slice(-8)}</div>
              <div className="text-sm text-gray-500">{order.restaurantName}</div>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-6 py-4">
          <Badge className={`${statusConfig.color} border text-xs px-3 py-1`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
          </Badge>
        </td>

        {/* Items */}
        <td className="px-6 py-4">
          <div className="text-sm">
            <div className="font-medium text-gray-900">{order.items.length} items</div>
            <div className="text-gray-500 truncate max-w-32">
              {order.items[0]?.foodName}
              {order.items.length > 1 && ` +${order.items.length - 1} more`}
            </div>
          </div>
        </td>

        {/* Total */}
        <td className="px-6 py-4">
          <div className="font-semibold text-orange-600">{formatPrice(order.totalAmount)}</div>
        </td>

        {/* Date */}
        <td className="px-6 py-4">
          <div className="text-sm text-gray-500">
            {formatDate(order.createdAt)}
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
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
        </td>
      </tr>
  )
}

export function OrderCard({ order, onViewDetails, onReorder, onTrack, onCancel }: OrderRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon

  const canCancel = ['pending', 'confirmed'].includes(order.status)
  const canTrack = ['preparing', 'out_for_delivery'].includes(order.status)
  const canReorder = order.status === 'delivered'

  return (
    <div className="md:hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">#{order.id.slice(-8)}</div>
                <div className="text-sm text-gray-500">{order.restaurantName}</div>
              </div>
            </div>
            <Badge className={`${statusConfig.color} border text-xs px-2 py-1`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Order Details */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-semibold text-orange-600">{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Items</span>
              <span className="text-sm text-gray-900">{order.items.length} items</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm text-gray-900">{formatDate(order.createdAt)}</span>
            </div>
          </div>

          {/* Items Preview */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Items</span>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <span>{isExpanded ? 'Less' : 'All'}</span>
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="space-y-2">
              {order.items.slice(0, isExpanded ? order.items.length : 2).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium">
                      {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">{item.foodName}</span>
                  </div>
                  <span className="font-medium text-gray-700">{formatPrice(item.price)}</span>
                </div>
              ))}
              
              {!isExpanded && order.items.length > 2 && (
                <div className="text-sm text-gray-500 text-center py-1">
                  +{order.items.length - 2} more items
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
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
        </div>
      </div>
  )
}

