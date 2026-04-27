"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { canReorderCustomerStatus } from '@/lib/orders'
import { Order } from '@/services/order.service'
import { 
  Clock, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  RotateCcw,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useMemo, useState } from 'react'

interface OrderRowProps {
  order: Order
  onViewDetails: (orderId: string) => void
  onReorder: (orderId: string) => void
  onTrack: (orderId: string) => void
  onCancel: (orderId: string) => void
  onRequestRefund: (orderId: string) => void
}

const getStatusConfig = (status: Order['status']) => {
  // Display raw status on each item (bucket is only for filters).
  switch (status) {
    case 'pending':
      return { color: 'bg-yellow-50 text-yellow-800 border-yellow-200', icon: Clock, label: 'Waiting confirmation' }
    case 'confirmed':
      return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Package, label: 'Confirmed' }
    case 'preparing':
      return { color: 'bg-orange-50 text-orange-800 border-orange-200', icon: Package, label: 'Preparing' }
    case 'out_for_delivery':
      return { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Truck, label: 'Out for delivery' }
    case 'delivered':
      return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Delivered' }
    case 'completed':
      return { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Completed' }
    case 'cancelled':
      return { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Cancelled' }
    case 'refunded':
      return { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: RotateCcw, label: 'Refunded' }
    default:
      return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock, label: status }
  }
}

const getReturnStatusConfig = (status: Order['returnRequestStatus']) => {
  switch (status) {
    case 'PendingReview':
      return { color: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Return: Under review' }
    case 'Approved':
      return { color: 'bg-green-50 text-green-700 border-green-200', label: 'Return: Approved' }
    case 'Rejected':
      return { color: 'bg-red-50 text-red-700 border-red-200', label: 'Return: Rejected' }
    case 'CancelledByCustomer':
      return { color: 'bg-slate-50 text-slate-700 border-slate-200', label: 'Return: Cancelled' }
    case 'Completed':
      return { color: 'bg-slate-50 text-slate-700 border-slate-200', label: 'Return: Completed' }
    default:
      return null
  }
}

export function OrderRow({ order, onViewDetails, onReorder, onTrack, onCancel, onRequestRefund }: OrderRowProps) {
  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon
  const returnStatusConfig = getReturnStatusConfig(order.returnRequestStatus)

  const canCancel = order.status === 'pending'
  const canTrack = order.status === 'out_for_delivery'
  const canReorder = canReorderCustomerStatus(order.status)
  const canRequestRefund = (() => {
    if (order.returnRequestStatus) return false
    if (order.status !== 'delivered') return false
    // If deliveredAt is missing (older payload), allow opening modal; backend will validate.
    if (!order.deliveredAt) return true
    const deliveredAt = new Date(order.deliveredAt)
    if (Number.isNaN(deliveredAt.getTime())) return true
    return Date.now() - deliveredAt.getTime() <= 2 * 60 * 60 * 1000
  })()

  const secondaryActions = useMemo(() => {
    if (canCancel) return [{ key: 'cancel', label: 'Cancel order', onClick: () => onCancel(order.id) }]
    if (canTrack) return [{ key: 'track', label: 'Track order', onClick: () => onTrack(order.id) }]
    const actions: Array<{ key: string; label: string; onClick: () => void }> = []
    if (canRequestRefund) actions.push({ key: 'refund', label: 'Return / Refund', onClick: () => onRequestRefund(order.id) })
    if (canReorder) actions.push({ key: 'reorder', label: 'Reorder', onClick: () => onReorder(order.id) })
    return actions.slice(0, 2)
  }, [canCancel, canReorder, canRequestRefund, canTrack, onCancel, onReorder, onRequestRefund, onTrack, order.id])

  const getSecondaryTone = (key: string) =>
    key === 'cancel'
      ? 'text-red-600 border-red-200 hover:bg-red-50'
      : key === 'reorder'
        ? 'text-green-700 border-green-200 hover:bg-green-50'
        : key === 'refund'
          ? 'text-orange-700 border-orange-200 hover:bg-orange-50'
          : key === 'track'
            ? 'text-purple-700 border-purple-200 hover:bg-purple-50'
            : 'text-gray-700 border-gray-200 hover:bg-gray-50'

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
          <div className="flex flex-col gap-2">
            <Badge className={`${statusConfig.color} border text-xs px-3 py-1 w-fit`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
            {returnStatusConfig ? (
              <Badge className={`${returnStatusConfig.color} border text-[11px] px-2.5 py-1 w-fit`}>
                {returnStatusConfig.label}
              </Badge>
            ) : null}
          </div>
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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(order.id)}
              className="text-xs px-3 py-1 h-7 bg-white"
            >
              <span>View details</span>
            </Button>

            {secondaryActions.map((a) => (
              <Button
                key={a.key}
                variant="outline"
                size="sm"
                onClick={a.onClick}
                className={`text-xs px-3 py-1 h-7 bg-white ${getSecondaryTone(a.key)}`}
              >
                <span>{a.label}</span>
              </Button>
            ))}
          </div>
        </td>
      </tr>
  )
}

export function OrderCard({ order, onViewDetails, onReorder, onTrack, onCancel, onRequestRefund }: OrderRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const statusConfig = getStatusConfig(order.status)
  const StatusIcon = statusConfig.icon
  const returnStatusConfig = getReturnStatusConfig(order.returnRequestStatus)

  const canCancel = order.status === 'pending'
  const canTrack = order.status === 'out_for_delivery'
  const canReorder = canReorderCustomerStatus(order.status)
  const canRequestRefund = (() => {
    if (order.returnRequestStatus) return false
    if (order.status !== 'delivered') return false
    if (!order.deliveredAt) return true
    const deliveredAt = new Date(order.deliveredAt)
    if (Number.isNaN(deliveredAt.getTime())) return true
    return Date.now() - deliveredAt.getTime() <= 2 * 60 * 60 * 1000
  })()

  const secondaryActions = useMemo(() => {
    if (canCancel) return [{ key: 'cancel', label: 'Cancel order', onClick: () => onCancel(order.id) }]
    if (canTrack) return [{ key: 'track', label: 'Track order', onClick: () => onTrack(order.id) }]
    const actions: Array<{ key: string; label: string; onClick: () => void }> = []
    if (canRequestRefund) actions.push({ key: 'refund', label: 'Return / Refund', onClick: () => onRequestRefund(order.id) })
    if (canReorder) actions.push({ key: 'reorder', label: 'Reorder', onClick: () => onReorder(order.id) })
    return actions.slice(0, 2)
  }, [canCancel, canReorder, canRequestRefund, canTrack, onCancel, onReorder, onRequestRefund, onTrack, order.id])

  const getSecondaryTone = (key: string) =>
    key === 'cancel'
      ? 'text-red-600 border-red-200 hover:bg-red-50'
      : key === 'reorder'
        ? 'text-green-700 border-green-200 hover:bg-green-50'
        : key === 'refund'
          ? 'text-orange-700 border-orange-200 hover:bg-orange-50'
          : key === 'track'
            ? 'text-purple-700 border-purple-200 hover:bg-purple-50'
            : 'text-gray-700 border-gray-200 hover:bg-gray-50'

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
            <div className="flex flex-col items-end gap-1.5">
              <Badge className={`${statusConfig.color} border text-xs px-2 py-1`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
              {returnStatusConfig ? (
                <Badge className={`${returnStatusConfig.color} border text-[11px] px-2 py-1`}>
                  {returnStatusConfig.label}
                </Badge>
              ) : null}
            </div>
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
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(order.id)}
              className="text-xs px-3 py-1 h-7 bg-white"
            >
              <span>View details</span>
            </Button>

            {secondaryActions.map((a) => (
              <Button
                key={a.key}
                variant="outline"
                size="sm"
                onClick={a.onClick}
                className={`text-xs px-3 py-1 h-7 bg-white ${getSecondaryTone(a.key)}`}
              >
                <span>{a.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
  )
}

