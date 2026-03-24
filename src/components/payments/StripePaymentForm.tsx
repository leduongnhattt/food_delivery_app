'use client'
import { useState } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Lock, AlertCircle } from 'lucide-react'
import { buildHeaders } from '@/lib/http-client'

interface StripePaymentFormProps {
  amount: number
  cartItems: any[]
  deliveryInfo: any
  voucherCode?: string
  onPaymentError: (error: string) => void
}

export function StripePaymentForm({ 
  amount,
  cartItems,
  deliveryInfo,
  voucherCode,
  onPaymentError 
}: StripePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create checkout session
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          cartItems,
          deliveryInfo,
          voucherCode,
          total: amount
        }),
      })

      const { url, error: apiError } = await response.json()

      if (apiError) {
        throw new Error(apiError)
      }

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      onPaymentError(errorMessage)
      
      // Redirect to cancel page on failure
      setTimeout(() => {
        window.location.href = '/checkout/cancel'
      }, 2000) // Wait 2 seconds to show error message
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'Inter, system-ui, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-orange-500" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Card Information
            </label>
            <div className="p-3 border border-gray-300 rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)} USD`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
