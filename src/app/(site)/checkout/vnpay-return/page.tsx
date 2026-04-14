'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { CheckoutService } from '@/services/checkout.service'
import { CHECKOUT_PAYMENT_METHOD } from '@/lib/payment-method'

type ReturnState = {
  status: 'processing' | 'success' | 'failed' | 'invalid_signature'
  orderId?: string
  message?: string
}

function extractOrderIdFromOrderInfo(orderInfo?: string | null): string | undefined {
  if (!orderInfo) return undefined
  // We send `vnp_OrderInfo: "Order <orderId>"` from the server.
  const m = orderInfo.match(/Order\s+([A-Za-z0-9\-_]+)/)
  return m?.[1]
}

export default function VnPayReturnPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cartItems, removeFromCart } = useCart()

  const responseCode = searchParams.get('vnp_ResponseCode')
  const transactionStatus = searchParams.get('vnp_TransactionStatus')
  const orderInfo = searchParams.get('vnp_OrderInfo')

  const pending = useMemo(() => {
    if (typeof window === 'undefined') return null
    const raw = sessionStorage.getItem('vnpay_pending')
    if (!raw) return null
    try {
      return JSON.parse(raw) as { orderId?: string; paymentId?: string; phone?: string; address?: string }
    } catch {
      return null
    }
  }, [])

  const [state, setState] = useState<ReturnState>(() => ({
    status: 'processing',
    orderId: pending?.orderId || extractOrderIdFromOrderInfo(orderInfo),
  }))

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const qs = new URLSearchParams(searchParams.toString())
      if (!qs.get('vnp_SecureHash')) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            status: 'failed',
            message: 'Missing payment parameters from VNPAY.',
          }))
        }
        return
      }

      const verify = await CheckoutService.verifyVnPayReturnQuery(qs)
      if (cancelled) return

      if (!verify.valid) {
        setState({
          status: 'invalid_signature',
          orderId: pending?.orderId || extractOrderIdFromOrderInfo(orderInfo),
          message:
            verify.error ||
            'Invalid secure hash (vnp_SecureHash). Do not trust this return URL; check secret and signing rules on the server.',
        })
        return
      }

      const rc = verify.responseCode ?? responseCode
      const ts = verify.transactionStatus ?? transactionStatus
      const success = rc === '00' && ts === '00'

      if (success) {
        setState((s) => ({
          ...s,
          status: 'success',
          message: 'Payment received. Your order is being confirmed.',
        }))
        let selectedRestaurantId: string | null = null
        try {
          selectedRestaurantId = localStorage.getItem('cartSelectedRestaurantId')
        } catch {}

        const itemsToClear = selectedRestaurantId
          ? cartItems.filter((ci) => ci.menuItem.restaurantId === selectedRestaurantId)
          : cartItems

        for (const item of itemsToClear) {
          removeFromCart(item.menuItem.id)
        }
        const oid = pending?.orderId || extractOrderIdFromOrderInfo(orderInfo)
        if (oid) {
          const params = new URLSearchParams({
            orderId: oid,
            paymentMethod: CHECKOUT_PAYMENT_METHOD.VnPay,
            phone: pending?.phone || '',
            address: pending?.address || '',
          })
          router.replace(`/order-success?${params.toString()}`)
        }
        return
      }

      if (rc || ts) {
        setState((s) => ({
          ...s,
          status: 'failed',
          message: 'Payment was not completed. You can try again.',
        }))
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [searchParams, responseCode, transactionStatus, orderInfo, pending, router, cartItems, removeFromCart])

  const title =
    state.status === 'processing'
      ? 'Processing payment...'
      : state.status === 'success'
        ? 'Payment successful'
        : state.status === 'invalid_signature'
          ? 'Invalid signature'
          : 'Payment failed'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                state.status === 'success'
                  ? 'bg-green-100'
                  : state.status === 'failed' || state.status === 'invalid_signature'
                    ? 'bg-red-100'
                    : 'bg-gray-100'
              }`}
            >
              {state.status === 'success' ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : state.status === 'failed' || state.status === 'invalid_signature' ? (
                <XCircle className="w-8 h-8 text-red-600" />
              ) : (
                <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          {state.message && <p className="text-gray-600 mt-2">{state.message}</p>}
        </CardHeader>

        <CardContent className="space-y-4">
          {state.orderId && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-medium">#{state.orderId}</span>
              </div>
            </div>
          )}

          {(state.status === 'failed' || state.status === 'invalid_signature') && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => router.push('/checkout')} className="flex-1 bg-orange-500 hover:bg-orange-600">
                Try again
              </Button>
              <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          )}

          {state.status === 'processing' && (
            <div className="text-center text-sm text-gray-600">
              Please wait while we confirm your payment.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

