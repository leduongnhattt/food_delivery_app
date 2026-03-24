'use client'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatPrice, calculatePrice } from '@/lib/utils'
import { CartItem as CartItemType } from '@/types/models'
import { CartItem } from './cart-item'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/lib/i18n'
import { exceedsItemValueLimit, getOrderLimitLabel } from '@/lib/order-limit'
import { AlertTriangle } from 'lucide-react'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItemType[]
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onRemove: (menuItemId: string) => void
  onCheckout: () => void
}

export function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemove,
  onCheckout
}: CartSidebarProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { t, locale } = useTranslations()
  const [groupLimitWarnings, setGroupLimitWarnings] = useState<Record<string, boolean>>({})
  // Unique items count (not quantities)
  const totalItems = cartItems.length
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + calculatePrice(item.menuItem.price, item.quantity),
    0
  )

  // Group items by restaurant
  const groups = useMemo(() => {
    const map: Record<string, { name: string; items: CartItemType[]; subtotal: number }> = {}
    for (const ci of cartItems) {
      const rid = ci.menuItem.restaurantId
      const rname = ci.menuItem.restaurantName || 'Restaurant'
      if (!map[rid]) {
        map[rid] = { name: rname, items: [], subtotal: 0 }
      }
      map[rid].items.push(ci)
      map[rid].subtotal += calculatePrice(ci.menuItem.price, ci.quantity)
    }
    return Object.entries(map).map(([rid, v]) => ({ id: rid, ...v }))
  }, [cartItems])

  const handleCheckoutGroup = (restaurantId: string) => {
    const group = groups.find(g => g.id === restaurantId)
    if (group) {
      const hasLimitViolation = group.items.some(item =>
        exceedsItemValueLimit(item.menuItem.price, item.quantity)
      )
      if (hasLimitViolation) {
        setGroupLimitWarnings(prev => ({ ...prev, [restaurantId]: true }))
        return
      }
      setGroupLimitWarnings(prev => ({ ...prev, [restaurantId]: false }))
    }

    try { localStorage.setItem('cartSelectedRestaurantId', restaurantId) } catch {}
    // If user is not authenticated, prompt login modal instead of proceeding
    if (!isLoading && !isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    onCheckout()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Your Cart ({totalItems})</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Cart Items - grouped by restaurant */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🛒</span>
                </div>
                <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground">
                  Add some delicious food to get started!
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {groups.map(group => (
                  <div key={group.id} className="py-2">
                    <div className="px-4 py-2 bg-gray-50 flex items-center justify-between border-b">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-semibold text-gray-900 truncate" title={group.name || group.id}>
                          {group.name || `#${group.id.slice(0,8)}`}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 px-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleCheckoutGroup(group.id)}
                        aria-label={`Checkout ${group.name || 'restaurant'}`}
                      >
                        Checkout
                      </Button>
                    </div>
                    <div className="divide-y">
                      {group.items.map(item => (
                        <CartItem
                          key={item.menuItem.id}
                          item={item}
                          onUpdateQuantity={onUpdateQuantity}
                          onRemove={onRemove}
                        />
                      ))}
                    </div>
                    {(groupLimitWarnings[group.id] ||
                      group.items.some(item => exceedsItemValueLimit(item.menuItem.price, item.quantity))) && (
                      <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {t('cart.orderLimitExceeded').replace(
                            '{amount}',
                            getOrderLimitLabel(locale, formatPrice)
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">{formatPrice(group.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && groups.length === 1 && (
            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Login required modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowLoginPrompt(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-2">Sign in required</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please sign in to proceed to checkout.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLoginPrompt(false)}>Cancel</Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => {
                  setShowLoginPrompt(false)
                  onClose()
                  router.push('/signin')
                }}
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
