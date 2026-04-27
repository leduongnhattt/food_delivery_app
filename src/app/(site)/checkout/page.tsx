'use client'
import { Button } from '@/components/ui/button'
import { formatPrice, calculatePrice } from '@/lib/utils'
import { CartItem } from '@/types/models'
import { useCart } from '@/hooks/use-cart'
import { useDeliveryData } from '@/hooks/account-hooks'
import { useAuth } from '@/hooks/auth-hooks'
import { useRouter } from 'next/navigation'
import { PaymentService } from '@/services/payment.service'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RestaurantService } from '@/services/restaurant.service'
import { VoucherService } from '@/services/voucher.service'
import { RestaurantHeader } from '@/components/checkout/RestaurantHeader'
import { CartItems } from '@/components/checkout/CartItems'
import { DeliveryForm } from '@/components/checkout/DeliveryForm'
import { PromoOffers } from '@/components/checkout/PromoOffers'
import { PaymentSelector } from '@/components/checkout/PaymentSelector'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { useToast } from '@/contexts/toast-context'
import { useTranslations } from '@/lib/i18n'
import {
  exceedsItemValueLimit,
  getOrderLimitLabel,
  CHECKOUT_PAYMENT_METHOD,
  getCheckoutPrimaryButtonLabel,
  type CheckoutPaymentMethod,
} from '@/lib/orders'
import { OrderService } from '@/services/order.service'
import type { Order } from '@/services/order.service'

const RESTAURANT_LOGO_DEBOUNCE_MS = 200

// Offers now loaded from API

// Types
type AppliedVoucher = { code: string; discount: number } | null

interface CheckoutData {
  cartItems: CartItem[]
  deliveryInfo: {
    phone: string
    address: string
    lat?: number
    lng?: number
  }
  voucherCode?: string
  total: number
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalStorageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

function pickSelectedRestaurantId(
  cartItems: CartItem[],
  storedRestaurantId: string | null
): string | null {
  if (cartItems.length === 0) return null
  const storedExists =
    storedRestaurantId && cartItems.some((ci) => ci.menuItem.restaurantId === storedRestaurantId)
  return storedExists ? storedRestaurantId : cartItems[0].menuItem.restaurantId
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cartItems, updateQuantity, removeFromCart } = useCart()
  const { deliveryData, isLoading: isDeliveryLoading } = useDeliveryData()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { showToast } = useToast()
  const { t, locale } = useTranslations()
  
  // State management
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null)
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher>(null)
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>(
    CHECKOUT_PAYMENT_METHOD.Cash,
  )
  const [hasConfirmedPaymentMethod, setHasConfirmedPaymentMethod] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null)
  const [restaurantInfo, setRestaurantInfo] = useState<{
    name: string
    rating: number
    deliveryTime: string
    address: string
    deliveryFee: number
  } | null>(null)
  const [availableVouchers, setAvailableVouchers] = useState<{ code: string, amount?: number, percent?: number, minOrder?: number }[]>([])
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const hasLoadedVouchersRef = useRef(false)
  const [reorderSourceOrder, setReorderSourceOrder] = useState<Order | null>(null)

  const reorderFromQuery = searchParams.get('reorder')

  useEffect(() => {
    if (!reorderFromQuery) return
    let cancelled = false
    void (async () => {
      try {
        const o = await OrderService.getOrderById(reorderFromQuery)
        if (cancelled) return
        setReorderSourceOrder(o as Order)
        router.replace('/checkout', { scroll: false })
      } catch {
        if (!cancelled) {
          showToast('Could not load previous order for delivery details', 'warning', 4000)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reorderFromQuery, router, showToast])

  useEffect(() => {
    const stored = safeLocalStorageGet('cartSelectedRestaurantId')
    const next = pickSelectedRestaurantId(cartItems, stored)
    if (!next) return

    // If we don't have a selection yet, or the current selection is no longer valid, refresh it.
    if (!selectedRestaurantId || !cartItems.some((ci) => ci.menuItem.restaurantId === selectedRestaurantId)) {
      setSelectedRestaurantId(next)
      safeLocalStorageSet('cartSelectedRestaurantId', next)
      return
    }

    safeLocalStorageSet('cartSelectedRestaurantId', selectedRestaurantId)
  }, [cartItems, selectedRestaurantId])

  const selectedCartItems = useMemo(() => {
    if (!selectedRestaurantId) return cartItems
    return cartItems.filter((ci) => ci.menuItem.restaurantId === selectedRestaurantId)
  }, [cartItems, selectedRestaurantId])

  const clearSelectedFromCart = useCallback(() => {
    for (const item of selectedCartItems) {
      removeFromCart(item.menuItem.id)
    }
  }, [removeFromCart, selectedCartItems])

  // Auto-apply promo from query (?promo=CODE) using API validation
  useEffect(() => {
    const promo = searchParams.get('promo')
    if (!promo) return
    VoucherService.validate(promo)
      .then((v) => {
        if (v) setAppliedVoucher({ code: promo, discount: Number(v.DiscountAmount) || 0 })
      })
      .finally(() => router.replace('/checkout'))
  }, [searchParams, router])

  // Calculate totals
  const totalItems = selectedCartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = selectedCartItems.reduce(
    (sum, item) => sum + calculatePrice(item.menuItem.price, item.quantity),
    0
  )
  const voucherDiscount = appliedVoucher?.discount || 0
  const deliveryFee = restaurantInfo?.deliveryFee ?? 0
  const total = Math.max(0, subtotal + deliveryFee - voucherDiscount)

  const effectivePhone = useMemo(
    () =>
      reorderSourceOrder?.recipientPhone?.trim() ||
      deliveryData.phone?.trim() ||
      '',
    [reorderSourceOrder, deliveryData.phone],
  )
  const effectiveAddress = useMemo(
    () =>
      reorderSourceOrder?.deliveryAddress?.trim() ||
      deliveryData.address?.trim() ||
      '',
    [reorderSourceOrder, deliveryData.address],
  )

  // Get restaurant info from API (includes deliveryTime/address). Fallback to cart item name.
  useEffect(() => {
    const first = selectedCartItems[0]?.menuItem
    if (!first?.restaurantId) {
      setRestaurantInfo(null)
      return
    }

    const destLat = deliveryData.lat ?? undefined
    const destLng = deliveryData.lng ?? undefined
    const destAddress = effectiveAddress || deliveryData.address?.trim()

    const timeoutId = setTimeout(() => {
      RestaurantService.getRestaurantById(first.restaurantId, {
        ...(destLat != null && destLng != null ? { destLat, destLng } : {}),
        ...(destLat == null || destLng == null ? { destAddress } : {}),
      })
        .then((restaurant: any) => {
          setRestaurantInfo({
            name: restaurant?.name || first.restaurantName || 'Restaurant Name',
            rating: Number(restaurant?.rating ?? 0),
            deliveryTime: restaurant?.deliveryTime || '—',
            address: restaurant?.address || '—',
            deliveryFee: Number(restaurant?.deliveryFee ?? 0) || 0,
          })
          if (restaurant?.avatarUrl) setRestaurantLogo(restaurant.avatarUrl)
        })
        .catch(() => {
          setRestaurantInfo({
            name: first.restaurantName || 'Restaurant Name',
            rating: 0,
            deliveryTime: '—',
            address: '—',
            deliveryFee: 0,
          })
        })
    }, RESTAURANT_LOGO_DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [
    selectedCartItems,
    deliveryData.lat,
    deliveryData.lng,
    deliveryData.address,
    effectiveAddress,
  ])

  const hasDeliveryInfo = Boolean(effectivePhone && effectiveAddress)

  // restaurantLogo is handled by restaurantInfo fetch above

  // Note: Commission is a platform take-rate (deducted from enterprise settlement), not a customer fee.

  // Load vouchers exactly once per mount – avoids StrictMode double fetch & polling noise
  useEffect(() => {
    let isActive = true

    const loadVouchers = async () => {
      if (hasLoadedVouchersRef.current) return

      try {
        const list = await VoucherService.list()
        if (!isActive) return

        setAvailableVouchers(
          list.map((v: any) => ({
            code: v.Code,
            amount: Number(v.DiscountAmount) || undefined,
            percent: Number(v.DiscountPercent) || undefined,
            minOrder: Number(v.MinOrderValue) || undefined,
          }))
        )

        hasLoadedVouchersRef.current = true
      } catch (error) {
        console.error('Failed to load vouchers', error)
      }
    }

    loadVouchers()

    return () => {
      isActive = false
    }
  }, [])

  // Show loading while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Login Required</h1>
            <p className="text-gray-600 mb-6">Please login to place an order.</p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/signin')} 
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                Login
              </Button>
              <Button 
                onClick={() => router.push('/signup')} 
                variant="outline" 
                className="w-full"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Redirect if cart is empty - AFTER all hooks (skip during place order to avoid "cart is empty" flash)
  if (cartItems.length === 0 || selectedCartItems.length === 0) {
    if (isPlacingOrder) {
      return (
        <div className="container py-8 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4" />
            <p className="text-gray-600">Placing your order...</p>
          </div>
        </div>
      )
    }
    return (
      <div className="container py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">🛒</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some delicious food to get started!</p>
            <Button onClick={() => router.push('/')} className="bg-orange-500 hover:bg-orange-600">
              Browse Restaurants
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleQuantityChange = (menuItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(menuItemId)
    } else {
      updateQuantity(menuItemId, newQuantity)
    }
  }

  const handleApplyVoucher = (code: string) => {
    const v = availableVouchers.find(o => o.code === code)
    if (!v) return
    const discount = Number(v.amount || 0)
    setAppliedVoucher({ code, discount })
    setIsOffersModalOpen(false)
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
  }

  const handlePlaceOrder = async () => {
    try {
      const violatingItem = selectedCartItems.find((item) =>
        exceedsItemValueLimit(item.menuItem.price, item.quantity)
      )
      if (violatingItem) {
        showToast(
          t('cart.orderLimitExceeded').replace(
            '{amount}',
            getOrderLimitLabel(locale, formatPrice)
          ),
          'warning',
          8000
        )
        return
      }

      const trimmedPhone = effectivePhone
      const trimmedAddress = effectiveAddress

      if (!trimmedPhone || !trimmedAddress) {
        showToast(
          t('checkout.deliveryInfo.missingMessage'),
          'warning',
          12000,
          { label: t('checkout.deliveryInfo.profileAction'), href: '/profile' }
        )
        return
      }

      const checkoutData: CheckoutData = {
        cartItems: selectedCartItems,
        deliveryInfo: {
          phone: trimmedPhone,
          address: trimmedAddress,
          ...(Number.isFinite(deliveryData.lat) && Number.isFinite(deliveryData.lng)
            ? { lat: deliveryData.lat as number, lng: deliveryData.lng as number }
            : {}),
        },
        voucherCode: appliedVoucher?.code,
        total: total
      }

      // User is confirming the order, treat payment choice as confirmed (even if default Cash).
      setHasConfirmedPaymentMethod(true)
      setIsPlacingOrder(true)
      switch (paymentMethod) {
        case CHECKOUT_PAYMENT_METHOD.Stripe:
          await handleStripePayment(checkoutData)
          break
        case CHECKOUT_PAYMENT_METHOD.VnPay:
          await handleVnPayPayment(checkoutData)
          break
        case CHECKOUT_PAYMENT_METHOD.Cash:
          await handleCashPayment(checkoutData)
          break
        default:
          setIsPlacingOrder(false)
          showToast('This payment method is not supported yet.', 'warning', 6000)
      }
    } catch (error) {
      console.error('Error processing order:', error)
      alert('Failed to process order')
      setIsPlacingOrder(false)
    }
  }

  const handleStripePayment = async (checkoutData: CheckoutData) => {
    const result = await PaymentService.processStripePayment(checkoutData)

    if (result.error) {
      setIsPlacingOrder(false)
      alert(`Failed to create checkout session: ${result.error}`)
      return
    }

    if (result.redirectUrl) {
      window.location.href = result.redirectUrl
    }
  }

  const handleVnPayPayment = async (checkoutData: CheckoutData) => {
    const result = await PaymentService.processVnPayPayment(checkoutData)

    if (!result.success) {
      setIsPlacingOrder(false)
      alert(`Failed to create VNPay payment URL: ${result.error}`)
      return
    }

    if (result.paymentId && typeof window !== 'undefined') {
      sessionStorage.setItem(
        'vnpay_pending',
        JSON.stringify({
          paymentId: result.paymentId,
          phone: checkoutData.deliveryInfo.phone,
          address: checkoutData.deliveryInfo.address,
        })
      )
    }

    if (result.redirectUrl) {
      window.location.href = result.redirectUrl
    }
  }

  const handleCashPayment = async (checkoutData: CheckoutData) => {
    const paymentNotification = PaymentService.createPaymentNotification()

    const result = await PaymentService.processCashOnDelivery(
      checkoutData,
      clearSelectedFromCart,
      paymentNotification
    )

    if (result.success && result.orderId) {
      // Cart is already cleared in PaymentService.processCashOnDelivery()
      // Keep isPlacingOrder true until redirect so we don't flash "cart is empty"
      paymentNotification.notifyOtherTabs()

      const deliveryParams = new URLSearchParams({
        orderId: result.orderId,
        paymentMethod: CHECKOUT_PAYMENT_METHOD.Cash,
        phone: deliveryData.phone,
        address: deliveryData.address
      })
      router.push(`/order-success?${deliveryParams.toString()}`)
    } else {
      setIsPlacingOrder(false)
      alert(`Failed to create order: ${result.error}`)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Progress */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.back()}
                className="flex items-center gap-2 h-9 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Checkout
              </h1>
            </div>
            
            {/* Checkout progress (not order status) */}
            <div className="flex items-center justify-center mb-8">
              {(() => {
                const steps = [
                  { key: 'cart', label: 'Cart', done: cartItems.length > 0 },
                  { key: 'delivery', label: 'Delivery', done: hasDeliveryInfo },
                  {
                    key: 'payment',
                    label: 'Payment',
                    // paymentMethod always has a default; only mark done when user confirmed/changed it
                    done: hasConfirmedPaymentMethod,
                  },
                  // We navigate away on success; this step is typically "active" while placing.
                  { key: 'confirm', label: 'Confirm', done: false },
                ]

                const currentIdx = isPlacingOrder
                  ? steps.length - 1
                  : Math.min(
                      steps.findIndex(s => !s.done),
                      steps.length - 1
                    )

                return (
                  <div className="flex items-center">
                    {steps.map((s, idx) => {
                      const active = idx === currentIdx
                      const done = s.done
                      const circleCls = done
                        ? 'bg-orange-500 text-white'
                        : active
                          ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-300'
                          : 'bg-gray-200 text-gray-500'

                      const textCls = done
                        ? 'text-orange-600'
                        : active
                          ? 'text-orange-700'
                          : 'text-gray-500'

                      const lineCls = steps[idx]?.done
                        ? 'bg-orange-300'
                        : 'bg-gray-300'

                      return (
                        <Fragment key={s.key}>
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${circleCls}`}>
                              {done ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${textCls}`}>{s.label}</span>
                          </div>
                          {idx < steps.length - 1 ? (
                            <div className={`w-14 sm:w-16 h-0.5 mx-3 ${lineCls}`} />
                          ) : null}
                        </Fragment>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left - Order & Restaurant */}
            <div className="space-y-6">
              {/* Restaurant Information */}
              {restaurantInfo && (
                <RestaurantHeader
                  name={restaurantInfo.name}
                  rating={restaurantInfo.rating}
                  deliveryTime={restaurantInfo.deliveryTime}
                  address={restaurantInfo.address}
                  logoUrl={restaurantLogo || undefined}
                />
              )}

              <CartItems items={selectedCartItems} totalItems={totalItems} onChangeQuantity={handleQuantityChange} onRemove={(id) => removeFromCart(id)} />
            </div>

            {/* Right - Checkout Form */}
            <div className="space-y-6">
              <DeliveryForm 
                phone={effectivePhone} 
                address={effectiveAddress} 
                isLoading={isDeliveryLoading}
                reorderHint={
                  reorderSourceOrder
                    ? `Using delivery details from order #${reorderSourceOrder.id.slice(0, 8)}…`
                    : null
                }
                deliveryInstructions={reorderSourceOrder?.deliveryInstructions ?? null}
              />

              <PromoOffers
                applied={appliedVoucher}
                offers={availableVouchers.map(v => ({ code: v.code, amount: v.amount, percent: v.percent, minOrder: v.minOrder, eligible: subtotal >= (v.minOrder || 0) }))}
                isModalOpen={isOffersModalOpen}
                onOpenModal={() => setIsOffersModalOpen(true)}
                onCloseModal={() => setIsOffersModalOpen(false)}
                onApply={handleApplyVoucher}
                onRemove={handleRemoveVoucher}
              />

              {/* Offers modal moved inside PromoOffers */}

              <PaymentSelector
                method={paymentMethod}
                isModalOpen={isPaymentModalOpen}
                onOpen={() => setIsPaymentModalOpen(true)}
                onClose={() => setIsPaymentModalOpen(false)}
                onChange={(m) => {
                  setPaymentMethod(m)
                  setHasConfirmedPaymentMethod(true)
                }}
              />

              <OrderSummary
                totalItems={totalItems}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                discount={appliedVoucher ? { code: appliedVoucher.code, amount: appliedVoucher.discount } : null}
                total={total}
                buttonText={getCheckoutPrimaryButtonLabel(
                  paymentMethod,
                  formatPrice(total),
                )}
                onPlaceOrder={handlePlaceOrder}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

