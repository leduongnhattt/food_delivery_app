'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, MapPin, Phone, Home, AlertTriangle } from 'lucide-react'
import { CHECKOUT_PAYMENT_METHOD } from '@/lib/payment-method'
import { OrderService } from '@/services/order.service'
import type { Order } from '@/services/order.service'

export default function OrderSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [orderDetails, setOrderDetails] = useState<Order | null>(null)
  
  const orderId = searchParams.get('orderId')
  const paymentMethod = searchParams.get('paymentMethod')
  const phone = searchParams.get('phone')
  const address = searchParams.get('address')

  // Function to fetch order details from API
  const fetchOrderDetails = useCallback(async (oid: string) => {
    try {
      return await OrderService.getOrderById(oid)
    } catch (error) {
      console.error('Error fetching order details:', error)
      return null
    }
  }, [])

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId).then(setOrderDetails)
    }
  }, [fetchOrderDetails, orderId])

  const expiresAt = orderDetails?.expiresAt ? new Date(orderDetails.expiresAt) : null
  const minutesLeft =
    expiresAt && orderDetails?.status === 'pending'
      ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / 60000))
      : null

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find your order details.</p>
            <Button onClick={() => router.push('/')} className="bg-orange-500 hover:bg-orange-600">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Order placed</h1>
            <p className="text-gray-600">
              Your order is waiting for the shop to confirm.
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">#{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-gray-900 capitalize">{orderDetails?.status || 'pending'}</span>
              </div>
              {orderDetails?.status === 'pending' && minutesLeft != null && (
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
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">
                  {paymentMethod === CHECKOUT_PAYMENT_METHOD.Cash
                    ? 'Cash on Delivery'
                    : paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Delivery:</span>
                <span className="font-medium">
                  {orderDetails?.estimatedDeliveryTime
                    ? new Date(orderDetails.estimatedDeliveryTime).toLocaleString()
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Delivery Address:</span>
                </div>
                <p className="ml-6 text-gray-800">
                  {orderDetails?.deliveryAddress || address || 'Your delivery address will be shown here'}
                </p>
                
                <div className="flex items-center gap-2 mt-4">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Contact:</span>
                </div>
                <p className="ml-6 text-gray-800">
                  {orderDetails?.recipientPhone || phone || 'Your phone number will be shown here'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info for Cash */}
          {paymentMethod === CHECKOUT_PAYMENT_METHOD.Cash && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-orange-500" />
                  Cash Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 font-medium mb-2">Payment on Delivery</p>
                  <p className="text-orange-700 text-sm">
                    Please have the exact amount ready when the delivery driver arrives. 
                    The driver will collect payment upon delivery.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => router.push('/')} 
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              Continue Shopping
            </Button>
            <Button 
              onClick={() => router.push('/orders')} 
              variant="outline" 
              className="flex-1"
            >
              View Order History
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
