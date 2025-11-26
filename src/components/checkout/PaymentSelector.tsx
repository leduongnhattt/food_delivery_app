'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Method = 'cash' | 'card' | 'momo' | 'stripe'

interface PaymentSelectorProps {
  method: Method
  isModalOpen: boolean
  onOpen: () => void
  onClose: () => void
  onChange: (m: Method) => void
}

export function PaymentSelector({ method, onChange }: PaymentSelectorProps) {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(['cash','card','stripe','momo'] as Method[]).map((m) => (
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
                <span className="text-2xl" aria-hidden>{m === 'cash' ? '💵' : m === 'card' ? '💳' : m === 'stripe' ? '💳' : '📱'}</span>
                <div>
                  <div className="font-medium">
                    {m === 'cash' ? 'Cash on Delivery' : m === 'card' ? 'Credit/Debit Card' : m === 'stripe' ? 'Stripe Payment' : 'MoMo Wallet'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {m === 'cash' ? 'Pay when the order arrives' : m === 'card' ? 'Use your Visa/MasterCard' : m === 'stripe' ? 'Secure checkout via Stripe' : 'Pay with MoMo app'}
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


