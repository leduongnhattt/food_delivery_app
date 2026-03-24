'use client'
import { Button } from '@/components/ui/button'
import { formatPrice, calculatePrice } from '@/lib/utils'
import { CartItem } from '@/types/models'
import { useCart } from '@/hooks/use-cart'
import { useDeliveryData } from '@/hooks/use-delivery-data'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { PaymentService } from '@/services/payment.service'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import { exceedsItemValueLimit, getOrderLimitLabel } from '@/lib/order-limit'

// Constants
const DEFAULT_COMMISSION_FEE = 0.5
const RESTAURANT_LOGO_DEBOUNCE_MS = 200

// Offers now loaded from API

// Types
type PaymentMethod = 'cash' | 'card' | 'momo' | 'stripe'
type AppliedVoucher = { code: string; discount: number } | null

interface CheckoutData {
  cartItems: CartItem[]
  deliveryInfo: {
    phone: string
    address: string
  }
  voucherCode?: string
  total: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart()
  const { deliveryData, isLoading: isDeliveryLoading } = useDeliveryData()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { showToast } = useToast()
  const { t, locale } = useTranslations()
  
  // State management
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher>(null)
  const [isOffersModalOpen, setIsOffersModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [restaurantLogo, setRestaurantLogo] = useState<string | null>(null)
  const [availableVouchers, setAvailableVouchers] = useState<{ code: string, amount?: number, percent?: number, minOrder?: number }[]>([])
  const [commissionFee, setCommissionFee] = useState<number>(DEFAULT_COMMISSION_FEE)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const hasLoadedVouchersRef = useRef(false)

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
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cartItems.reduce(
    (sum, item) => sum + calculatePrice(item.menuItem.price, item.quantity),
    0
  )
  const voucherDiscount = appliedVoucher?.discount || 0
  const total = Math.max(0, subtotal + commissionFee - voucherDiscount)

  // Get restaurant info from first cart item
  const restaurantInfo = cartItems[0]?.menuItem ? {
    name: cartItems[0].menuItem.restaurantName || 'Restaurant Name',
    rating: 4.5,
    deliveryTime: '25-35 min',
    address: '123 Main Street, City'
  } : null

  // Debounced restaurant logo fetch
  useEffect(() => {
    const first = cartItems[0]?.menuItem
    if (!first) return
    
    const timeoutId = setTimeout(() => {
      RestaurantService.getRestaurantById(first.restaurantId)
        .then((restaurant) => {
          if (restaurant?.avatarUrl) setRestaurantLogo(restaurant.avatarUrl)
        })
        .catch(() => {}) // Silent fail for better UX
    }, RESTAURANT_LOGO_DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [cartItems])

  // Load commission fee from API based on restaurant
  useEffect(() => {
    const first = cartItems[0]?.menuItem
    if (!first?.restaurantId) return
    RestaurantService.getCommission(first.restaurantId)
      .then((res) => {
        if (res?.success) setCommissionFee(Number(res.commissionFee) || 0)
      })
      .catch(() => {})
  }, [cartItems])

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
  if (cartItems.length === 0) {
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
      const violatingItem = cartItems.find((item) =>
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

      const trimmedPhone = deliveryData.phone?.trim()
      const trimmedAddress = deliveryData.address?.trim()

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
        cartItems,
        deliveryInfo: {
          phone: trimmedPhone,
          address: trimmedAddress
        },
        voucherCode: appliedVoucher?.code,
        total: total
      }

      setIsPlacingOrder(true)
      if (paymentMethod === 'stripe') {
        await handleStripePayment(checkoutData)
      } else if (paymentMethod === 'cash') {
        await handleCashPayment(checkoutData)
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

  const handleCashPayment = async (checkoutData: CheckoutData) => {
    const paymentNotification = PaymentService.createPaymentNotification()

    const result = await PaymentService.processCashOnDelivery(
      checkoutData,
      clearCart,
      paymentNotification
    )

    if (result.success && result.orderId) {
      // Cart is already cleared in PaymentService.processCashOnDelivery()
      // Keep isPlacingOrder true until redirect so we don't flash "cart is empty"
      paymentNotification.notifyOtherTabs()

      const deliveryParams = new URLSearchParams({
        orderId: result.orderId,
        paymentMethod: 'cash',
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
            
            {/* Order Status Progress */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-orange-600">Confirmed</span>
                </div>
                <div className="w-16 h-0.5 bg-orange-300"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-orange-600">Preparing</span>
                </div>
                <div className="w-16 h-0.5 bg-orange-300"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-orange-600">On the way</span>
                </div>
                <div className="w-16 h-0.5 bg-gray-300"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center">
                    <Circle className="w-5 h-5" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-500">Delivered</span>
                </div>
              </div>
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

              <CartItems items={cartItems} totalItems={totalItems} onChangeQuantity={handleQuantityChange} onRemove={(id) => removeFromCart(id)} />
            </div>

            {/* Right - Checkout Form */}
            <div className="space-y-6">
              <DeliveryForm 
                phone={deliveryData.phone} 
                address={deliveryData.address} 
                isLoading={isDeliveryLoading}
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
                onChange={(m) => setPaymentMethod(m)}
              />

              <OrderSummary
                totalItems={totalItems}
                subtotal={subtotal}
                deliveryFee={commissionFee}
                discount={appliedVoucher ? { code: appliedVoucher.code, amount: appliedVoucher.discount } : null}
                total={total}
                buttonText={
                  paymentMethod === 'stripe'
                    ? `Pay Now — ${formatPrice(total)}`
                    : paymentMethod === 'cash'
                      ? `Confirm Order — ${formatPrice(total)}`
                      : `Proceed to Payment — ${formatPrice(total)}`
                }
                onPlaceOrder={handlePlaceOrder}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

