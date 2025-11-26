import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { CartItem as CartItemType } from '@/types/models'
import { StockValidationPopup, useStockValidationPopup } from '@/components/ui/stock-validation-popup'
import { validateFoodStock } from '@/lib/stock-validation'
import { useState, useEffect } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { exceedsItemValueLimit, getOrderLimitLabel } from '@/lib/order-limit'
import { useTranslations } from '@/lib/i18n'

interface CartItemProps {
  item: CartItemType
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onRemove: (menuItemId: string) => void
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { isOpen, validationResult, showValidation, hideValidation } = useStockValidationPopup()
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentQuantity, setCurrentQuantity] = useState(item.quantity)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const { t, locale } = useTranslations()

  // Sync with props when server data changes
  useEffect(() => {
    setCurrentQuantity(item.quantity)
  }, [item.quantity])

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemove(item.menuItem.id)
      return
    }

    if (exceedsItemValueLimit(item.menuItem.price, newQuantity)) {
      setShowLimitWarning(true)
      return
    }
    setShowLimitWarning(false)

    setIsUpdating(true)
    
    // Update local state immediately for responsive UI
    setCurrentQuantity(newQuantity)

    // Optimistic update - update UI immediately for better responsiveness
    onUpdateQuantity(item.menuItem.id, newQuantity)

    // Check stock in background (only for increases)
    if (newQuantity > currentQuantity) {
      try {
        const stockValidation = await validateFoodStock(item.menuItem.id, newQuantity)
        
        if (!stockValidation.isValid) {
          showValidation(stockValidation)
          // Revert the optimistic update
          setCurrentQuantity(currentQuantity)
          onUpdateQuantity(item.menuItem.id, currentQuantity)
        }
      } catch {
        // Ignore stock check errors for better UX
      }
    }

    // Reset loading state after a short delay
    setTimeout(() => setIsUpdating(false), 150)
  }

  const handleIncrement = () => {
    const newQuantity = currentQuantity + 1
    handleQuantityChange(newQuantity)
  }

  const handleDecrement = () => {
    const newQuantity = currentQuantity - 1
    handleQuantityChange(newQuantity)
  }

  return (
    <>
      <div className="grid grid-cols-[64px_1fr_auto_auto] items-center gap-4 p-4 border-b">
        <div className="relative w-16 h-16 rounded-lg overflow-hidden">
          <Image
            src={item.menuItem.image}
            alt={item.menuItem.name}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="min-w-0">
          <h3 className="font-medium text-sm truncate">{item.menuItem.name}</h3>
          <p className="text-sm text-muted-foreground">
            {formatPrice(item.menuItem.price)}
          </p>
          {item.specialInstructions && (
            <p className="text-xs text-muted-foreground mt-1">
              Note: {item.specialInstructions}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 min-w-[122px] justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecrement}
            className="w-8 h-8 p-0 rounded-md hover:bg-orange-50 hover:border-orange-200 transition-colors duration-150 active:scale-95"
          >
            -
          </Button>
          <span className={`w-8 text-center text-sm font-medium tabular-nums transition-colors duration-150 ${
            isUpdating ? 'text-orange-600' : ''
          }`}>
            {currentQuantity}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleIncrement}
            className="w-8 h-8 p-0 rounded-md hover:bg-orange-50 hover:border-orange-200 transition-colors duration-150 active:scale-95"
          >
            +
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.menuItem.id)}
          className="text-muted-foreground hover:text-red-600 hover:bg-red-50 ml-auto"
          aria-label="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      {showLimitWarning && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            {t('cart.orderLimitExceeded').replace(
              '{amount}',
              getOrderLimitLabel(locale, formatPrice)
            )}
          </span>
        </div>
      )}

      <StockValidationPopup
        isOpen={isOpen}
        onClose={hideValidation}
        validationResult={validationResult}
      />
    </>
  )
}
