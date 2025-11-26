'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AVAILABLE_OFFERS } from '@/data/offers'
import { formatPrice } from '@/lib/utils'
import { useMemo, useState } from 'react'

export default function OffersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [query, setQuery] = useState(q)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return AVAILABLE_OFFERS
    return AVAILABLE_OFFERS.filter(o =>
      o.code.toLowerCase().includes(term) || o.description.toLowerCase().includes(term)
    )
  }, [query])

  const handleApply = (code: string) => {
    // Redirect back to checkout with applied promo code
    const params = new URLSearchParams({ promo: code })
    router.push(`/checkout?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle>Available Offers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search promo codes" />
                <Button variant="outline" onClick={() => setQuery('')}>Clear</Button>
              </div>

              <div className="space-y-2">
                {filtered.map(o => (
                  <div key={o.code} className={`flex items-center justify-between p-4 rounded-lg border ${o.eligible ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                    <div>
                      <div className="font-semibold">{o.code} - {formatPrice(o.discount)} off</div>
                      <div className="text-sm text-gray-600">{o.description}</div>
                    </div>
                    <Button disabled={!o.eligible} onClick={() => handleApply(o.code)}>Apply</Button>
                  </div>
                ))}
              </div>

              <div className="text-right">
                <Button variant="ghost" onClick={() => router.push('/checkout')}>Back to Checkout</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


