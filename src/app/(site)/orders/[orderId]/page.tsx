'use client'

import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ArrowLeft, Clock, MapPin, Package, RotateCcw, XCircle } from 'lucide-react'
import { OrderService } from '@/services/order.service'
import type { Order } from '@/services/order.service'
import { formatPrice, formatDate } from '@/lib/utils'

function getStatusTone(status: Order['status']) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200'
    case 'confirmed':
    case 'preparing':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'out_for_delivery':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'delivered':
    case 'completed':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'refunded':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

function cancelReasonLabel(reason?: string | null) {
  if (!reason) return null
  if (reason === 'accept_timeout') return 'Shop did not confirm within 30 minutes'
  if (reason === 'enterprise_cancelled') return 'Cancelled by shop'
  if (reason === 'payment_failed') return 'Payment failed'
  return reason
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams<{ orderId: string }>()
  const orderId = params?.orderId

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    try {
      const res = await OrderService.getOrderById(orderId)
      setOrder(res)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load order'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  // Refresh while order may change due to enterprise confirm or cron timeout.
  useEffect(() => {
    if (!order) return
    const watchStatuses: Array<Order['status']> = ['pending', 'confirmed', 'preparing', 'out_for_delivery']
    if (!watchStatuses.includes(order.status)) return
    const id = window.setInterval(() => void load(), 2000)
    return () => window.clearInterval(id)
  }, [order, load])

  const minutesLeft = useMemo(() => {
    const expiresAt = order?.expiresAt ? new Date(order.expiresAt) : null
    if (!expiresAt) return null
    if (order?.status !== 'pending') return null
    return Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 60000))
  }, [order?.expiresAt, order?.status])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container py-8">
          <Button variant="outline" onClick={() => router.push('/orders')} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Card>
            <CardContent className="p-6 text-center text-gray-700">
              {error || 'Order not found'}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const reason = cancelReasonLabel(order.cancelReason)
  const statusTone = getStatusTone(order.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => router.push('/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={() => void load()}>
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 min-w-0">
                  <Package className="w-5 h-5 text-orange-600" />
                  <span className="truncate">Order #{order.id.slice(-8)}</span>
                </span>
                <Badge className={`${statusTone} border`}>{order.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.status === 'pending' && minutesLeft != null && (
                <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium">Waiting for shop confirmation</div>
                    <div className="text-yellow-800">
                      Auto-cancel in {minutesLeft} minute{minutesLeft === 1 ? '' : 's'} if not confirmed.
                    </div>
                  </div>
                </div>
              )}

              {order.status === 'cancelled' && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium">Order cancelled</div>
                    {reason && <div className="text-red-800">{reason}</div>}
                    {order.refundPending && (
                      <div className="mt-1 flex items-center gap-2 text-orange-800">
                        <RotateCcw className="w-4 h-4" />
                        Refund pending (will be processed later)
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-gray-500">Restaurant</div>
                  <div className="font-medium text-gray-900">{order.restaurantName}</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-gray-500">Total</div>
                  <div className="font-semibold text-orange-600">{formatPrice(order.totalAmount)}</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-gray-500">Created</div>
                  <div className="font-medium text-gray-900">{formatDate(order.createdAt)}</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    ETA
                  </div>
                  <div className="font-medium text-gray-900">
                    {order.estimatedDeliveryTime ? new Date(order.estimatedDeliveryTime).toLocaleString() : '—'}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-3 text-sm">
                <div className="text-gray-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Delivery address
                </div>
                <div className="font-medium text-gray-900 mt-1 break-words">{order.deliveryAddress}</div>
              </div>

              <div className="rounded-lg border bg-white p-3 text-sm">
                <div className="text-gray-500">Items</div>
                <div className="mt-2 space-y-2">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{it.foodName}</div>
                        <div className="text-gray-500 text-xs">x{it.quantity}</div>
                      </div>
                      <div className="font-medium text-gray-900">{formatPrice(it.price)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => router.push('/orders')}>
                  Back to Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

