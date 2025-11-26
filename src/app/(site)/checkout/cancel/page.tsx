'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function PaymentCancelPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear any temporary data
    localStorage.removeItem('checkout_session')
  }, [])

  const handleBackToCheckout = () => {
    router.push('/checkout')
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Payment Cancelled
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your payment was cancelled or failed. No charges have been made.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">
              What happened?
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Payment was cancelled by you</li>
              <li>• Payment method was declined</li>
              <li>• Network connection was interrupted</li>
              <li>• Session expired</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              Need help?
            </h4>
            <p className="text-sm text-blue-700">
              If you're having trouble with payment, try using a different payment method 
              or contact our support team for assistance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleBackToCheckout}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToHome}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your cart items are still saved. You can continue shopping or try again.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
