'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHECKOUT_PAYMENT_METHOD, CHECKOUT_PAYMENT_METHOD_UI_ORDER, type CheckoutPaymentMethod } from '@/lib/payment-method'

interface PaymentSelectorProps {
  method: CheckoutPaymentMethod
  isModalOpen: boolean
  onOpen: () => void
  onClose: () => void
  onChange: (m: CheckoutPaymentMethod) => void
}

export function PaymentSelector({ method, onChange }: PaymentSelectorProps) {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHECKOUT_PAYMENT_METHOD_UI_ORDER.map((m) => (
            <label
              key={m}
              className={`cursor-pointer p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                method === m ? 'border-orange-400 ring-2 ring-orange-100 bg-orange-50/50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value={m}
                checked={method === m}
                onChange={() => onChange(m)}
                className="mt-1 text-orange-500"
              />
              <div className="flex items-start gap-3">
                <span className="text-2xl" aria-hidden>
                  {m === CHECKOUT_PAYMENT_METHOD.Cash
                    ? '💵'
                    : m === CHECKOUT_PAYMENT_METHOD.Card || m === CHECKOUT_PAYMENT_METHOD.Stripe
                      ? '💳'
                      : '🏦'}
                </span>
                <div>
                  <div className="font-medium">
                    {m === CHECKOUT_PAYMENT_METHOD.Cash
                      ? 'Cash on Delivery'
                      : m === CHECKOUT_PAYMENT_METHOD.Card
                        ? 'Credit/Debit Card'
                        : m === CHECKOUT_PAYMENT_METHOD.Stripe
                          ? 'Stripe Payment'
                          : 'VNPAY'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {m === CHECKOUT_PAYMENT_METHOD.Cash
                      ? 'Pay when the order arrives'
                      : m === CHECKOUT_PAYMENT_METHOD.Card
                        ? 'Use your Visa/MasterCard'
                        : m === CHECKOUT_PAYMENT_METHOD.Stripe
                          ? 'Secure checkout via Stripe'
                          : 'Pay via VNPAY gateway'}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


