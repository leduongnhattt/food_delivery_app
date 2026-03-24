'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, calculatePrice } from '@/lib/utils'
import { useCart } from '@/hooks/use-cart'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Store, Plus, Minus, X, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { StockValidationPopup, useStockValidationPopup } from '@/components/ui/stock-validation-popup'
import { validateFoodStock } from '@/lib/stock-validation'
import { useTranslations } from '@/lib/i18n'
import { exceedsItemValueLimit, getOrderLimitLabel } from '@/lib/order-limit'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  food: {
    foodId: string
    dishName: string
    price: number
    description: string
    imageUrl: string
    restaurantId: string
    menu: {
      category: string
    }
  }
  restaurant: {
    id: string
    name: string
    rating: number
    deliveryTime: string
    logo?: string | null
  }
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  food,
  restaurant
}) => {
  const router = useRouter()
  const { addToCart, cartItems } = useCart()
  const { isOpen: isStockPopupOpen, validationResult, showValidation, hideValidation } = useStockValidationPopup()
  const [quantity, setQuantity] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const { t, locale } = useTranslations()
  const [showLimitWarning, setShowLimitWarning] = React.useState(false)

  const currentCartQuantity = React.useMemo(() => {
    const existing = cartItems.find((item) => item.menuItem.id === food.foodId)
    return existing?.quantity ?? 0
  }, [cartItems, food.foodId])

  const exceedsWithAdditional = (additionalQuantity: number) =>
    exceedsItemValueLimit(food.price, currentCartQuantity + additionalQuantity)

  // Check if this food is already in cart
  const handleAddToCart = async () => {
    if (exceedsWithAdditional(quantity)) {
      setShowLimitWarning(true)
      return
    }
    setShowLimitWarning(false)

    setIsLoading(true)
    
    try {
      // Check stock before adding to cart
      const stockValidation = await validateFoodStock(food.foodId, quantity)
      
      if (!stockValidation.isValid) {
        showValidation(stockValidation)
        return
      }
      
      // Convert food to MenuItem format
      const menuItem = {
        id: food.foodId,
        name: food.dishName,
        description: food.description,
        price: food.price,
        image: food.imageUrl || '/api/placeholder/300/200',
        category: food.menu.category,
        isAvailable: true,
        // Persist EnterpriseID for cart logic and show Enterprise (restaurant) name for UX
        restaurantId: food.restaurantId, // EnterpriseID in DB
        restaurantName: restaurant.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      console.log('Adding to cart:', { menuItem, quantity }) // Debug log
      addToCart(menuItem, quantity)
      onClose()
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewRestaurant = () => {
    router.push(`/restaurants/${food.restaurantId}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
        <div className="bg-white rounded-2xl w-full max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6 border-b bg-white">
          <h2 className="text-xl font-bold text-gray-900">Order Options</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {/* Food Details */}
          <div className="flex gap-4 sm:gap-5 mb-5 sm:mb-6">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
              <Image
                src={food.imageUrl || '/api/placeholder/300/200'}
                alt={food.dishName}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 text-base sm:text-lg truncate">{food.dishName}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{food.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {food.menu.category}
                </Badge>
                <span className="text-lg sm:text-xl font-bold text-orange-600">
                  {formatPrice(food.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-5 sm:mb-6">
            <div className="flex items-center gap-3 mb-2">
              {restaurant.logo ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={restaurant.logo}
                    alt={`${restaurant.name} logo`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <Store className="w-5 h-5 text-gray-600" />
              )}
              <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{restaurant.name}</h4>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>⭐ {restaurant.rating}</span>
              <span>🕒 {restaurant.deliveryTime}</span>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-5 sm:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quantity
            </label>
            <div className="flex items-center gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowLimitWarning(false)
                  setQuantity(Math.max(1, quantity - 1))
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 sm:w-10 text-center font-medium tabular-nums">{quantity}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (exceedsWithAdditional(quantity + 1)) {
                    setShowLimitWarning(true)
                    return
                  }
                  setShowLimitWarning(false)
                  setQuantity(quantity + 1)
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold text-orange-600">
                {formatPrice(calculatePrice(food.price, quantity))}
              </span>
            </div>

            {showLimitWarning && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  {t('cart.orderLimitExceeded').replace(
                    '{amount}',
                    getOrderLimitLabel(locale, formatPrice)
                  )}
                </span>
              </div>
            )}
          </div>
            </div>
          </div>

          {/* Current Cart Status removed per UX */}
        </div>

        {/* Sticky Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t p-4 sm:p-5 space-y-2">
          <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart ({quantity})
          </Button>
          <Button
            onClick={handleViewRestaurant}
            variant="outline"
            className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            View Full Menu
          </Button>
        </div>
        </div>
      </div>

      <StockValidationPopup
        isOpen={isStockPopupOpen}
        onClose={hideValidation}
        validationResult={validationResult}
      />
    </>
  )
}
