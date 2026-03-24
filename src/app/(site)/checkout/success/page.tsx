'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowLeft, Clock, MapPin } from 'lucide-react'
import { PaymentService } from '@/services/payment.service'
import { useCart } from '@/hooks/use-cart'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { clearCart } = useCart()
  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const processedOnceRef = useRef(false)
  
  const sessionId = searchParams.get('session_id')

  const processPaymentSuccess = useCallback(async (sessionId: string) => {
    if (isProcessing) return // Prevent duplicate calls
    
    try {
      setIsProcessing(true)
      setIsLoading(true)
      
      // Create payment notification utilities
      const notification = PaymentService.createPaymentNotification()
      
      // Process payment success using service
      const result = await PaymentService.handlePaymentSuccess(
        sessionId,
        clearCart,
        notification
      )
      
      if (result.success) {
        setOrderDetails({
          orderId: result.orderId,
          sessionId: sessionId
        })
        
        // Clean up notification
        notification.clearLocalStorage()
      } else {
        console.error('Payment processing failed:', result.error)
      }
    } catch (error) {
      console.error('Error processing payment:', error)
    } finally {
      setIsLoading(false)
      setIsProcessing(false)
    }
  }, [clearCart, isProcessing])

  useEffect(() => {
    if (!sessionId) return
    if (processedOnceRef.current) return

    processedOnceRef.current = true
    processPaymentSuccess(sessionId)
    // Remove query param to avoid re-trigger on state changes/navigation
    router.replace('/checkout/success')
  }, [sessionId, router, processPaymentSuccess])

  const handleBackToApp = () => {
    // Cart is already cleared above, just redirect to home
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your payment...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Payment Successful!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your order has been confirmed and payment processed successfully.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {orderDetails && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-medium">#{orderDetails.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-medium">{orderDetails.sessionId.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              What's Next?
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your order is being prepared</li>
              <li>• You'll receive updates via SMS/email</li>
              <li>• Estimated delivery time: 30-45 minutes</li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Delivery Information
            </h4>
            <p className="text-sm text-orange-700">
              Our delivery team will contact you when your order is ready for pickup.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleBackToApp}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/orders')}
              className="flex-1"
            >
              View Orders
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Thank you for choosing our food delivery service!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}