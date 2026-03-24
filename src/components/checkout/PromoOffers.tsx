'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Gift, Info } from 'lucide-react'
// Browse all offers removed per requirements
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'

interface Offer {
  code: string
  amount?: number
  percent?: number
  minOrder?: number
  description?: string
  eligible?: boolean
}

interface PromoOffersProps {
  applied: { code: string; discount: number } | null
  offers: Offer[]
  isModalOpen: boolean
  onOpenModal: () => void
  onCloseModal: () => void
  onApply: (code: string) => void
  onRemove: () => void
}

export function PromoOffers({ applied, offers, isModalOpen, onOpenModal, onCloseModal, onApply, onRemove }: PromoOffersProps) {
  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-orange-500" />
          Promo Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        {applied ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-800">{applied.code}</span>
              <span className="text-green-600">-{formatPrice(applied.discount)}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={onRemove} className="text-red-500 hover:text-red-700">Remove</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4 mt-0.5" />
              <span>Click to choose one promo or browse all offers.</span>
            </div>
            <Button className="w-full justify-between bg-orange-500 hover:bg-orange-600 text-white" onClick={onOpenModal} aria-haspopup="listbox" aria-expanded={isModalOpen}>
              <span className="flex items-center gap-2">
                <span aria-hidden>🎟️</span>
                Select a promo
              </span>
            </Button>
            {/* Browse all offers removed */}

            {isModalOpen && (
              <div className="mt-2 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="p-2 space-y-2 max-h-64 overflow-auto" role="listbox">
                  {offers.map((offer) => (
                    <button
                      key={offer.code}
                      type="button"
                      disabled={offer.eligible === false}
                      onClick={() => onApply(offer.code)}
                      className={`w-full text-left p-4 rounded-xl border transition-colors ${(offer.eligible ?? true) ? 'border-gray-200 hover:border-orange-300 hover:bg-orange-50' : 'border-gray-100 bg-gray-50 opacity-70 cursor-not-allowed'}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200">
                            <Image src="/images/logo.png" alt="Hanala Food" width={40} height={40} className="object-cover" />
                          </div>
                        </div>
                        {/* Texts */}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 truncate">
                            {offer.amount ? `Save ${formatPrice(offer.amount)}` : offer.percent ? `Save ${offer.percent}%` : 'Promotion'}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 truncate">
                            {offer.minOrder ? `Minimum spend ${formatPrice(offer.minOrder)}` : 'No minimum spend'}
                            {` • Code: ${offer.code}`}
                          </div>
                          {offer.eligible === false && (
                            <div className="text-xs text-red-600 mt-1">Not eligible yet{offer.minOrder ? ` • requires ${formatPrice(offer.minOrder)}+` : ''}</div>
                          )}
                        </div>
                        {/* Action */}
                        <Badge className={`${(offer.eligible ?? true) ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`} variant="secondary">Select</Badge>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-2 text-right">
                  <Button variant="ghost" size="sm" onClick={onCloseModal}>Close</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Removed popup/panel to prefer dedicated page */}
      </CardContent>
    </Card>
  )
}


