'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

interface OrderSummaryProps {
  totalItems: number
  subtotal: number
  deliveryFee: number
  discount?: { code: string; amount: number } | null
  total: number
  onPlaceOrder: () => void
  buttonText?: string
}

export function OrderSummary({ totalItems, subtotal, deliveryFee, discount, total, onPlaceOrder, buttonText }: OrderSummaryProps) {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Subtotal ({totalItems} items)</span>
            <span className="font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Commission Fee</span>
            <span className="font-medium">{formatPrice(deliveryFee)}</span>
          </div>
          {discount && (
            <div className="flex justify-between text-green-200">
              <span>Discount ({discount.code})</span>
              <span className="font-medium">-{formatPrice(discount.amount)}</span>
            </div>
          )}
          <div className="border-t border-white/30 pt-3">
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>
        <Button className="w-full mt-6 bg-white text-orange-600 hover:bg-gray-100 font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200" size="lg" onClick={onPlaceOrder}>
          {buttonText ?? `Place Order - ${formatPrice(total)}`}
        </Button>
      </CardContent>
    </Card>
  )
}


