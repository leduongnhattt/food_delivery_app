import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { CartItem as CartItemType } from '@/types/models'
import { StockValidationPopup, useStockValidationPopup } from '@/components/ui/stock-validation-popup'
import { validateFoodStock } from '@/lib/stock-validation'
import { useState, useEffect, useRef } from 'react'
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
  const [currentQuantity, setCurrentQuantity] = useState(item.quantity)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  const { t, locale } = useTranslations()
  
  // Use ref to always have access to latest quantity value for rapid clicks
  const quantityRef = useRef(item.quantity)
  // Track pending updates with sequence numbers to ensure order
  const pendingUpdateRef = useRef<{ quantity: number; sequence: number } | null>(null)
  const sequenceRef = useRef(0)

  // Keep ref in sync with state
  useEffect(() => {
    quantityRef.current = currentQuantity
  }, [currentQuantity])

  // Sync with props when server data changes, but only if we're not in the middle of an optimistic update
  useEffect(() => {
    // If server quantity matches our pending update, clear the pending flag
    if (pendingUpdateRef.current !== null && item.quantity === pendingUpdateRef.current.quantity) {
      pendingUpdateRef.current = null
      setCurrentQuantity(item.quantity)
      quantityRef.current = item.quantity
    } 
    // Only sync if there's no pending update (to avoid overwriting optimistic updates)
    else if (pendingUpdateRef.current === null) {
      // Use functional update to ensure we're comparing with latest state
      setCurrentQuantity(prev => {
        // Only sync if the value actually changed and we're not in the middle of an update
        if (prev !== item.quantity && quantityRef.current === prev) {
          quantityRef.current = item.quantity
          return item.quantity
        }
        return prev
      })
    }
  }, [item.quantity])

  const applyQuantityChange = (newQuantity: number, previousQuantity: number, sequence: number) => {
    // Only process if this is still the latest update
    if (pendingUpdateRef.current && pendingUpdateRef.current.sequence > sequence) {
      return // A newer update has already been processed
    }

    if (newQuantity <= 0) {
      onRemove(item.menuItem.id)
      return
    }

    if (exceedsItemValueLimit(item.menuItem.price, newQuantity)) {
      setShowLimitWarning(true)
      return
    }
    setShowLimitWarning(false)
    
    // Track the pending update with sequence number
    pendingUpdateRef.current = { quantity: newQuantity, sequence }

    // Optimistic update - send to server immediately (called after setState)
    onUpdateQuantity(item.menuItem.id, newQuantity)

    // Check stock in background (only for increases) - don't block UI
    if (newQuantity > previousQuantity) {
      // Run stock validation asynchronously without blocking
      validateFoodStock(item.menuItem.id, newQuantity)
        .then(stockValidation => {
          // Only revert if this is still the latest update
          if (pendingUpdateRef.current?.sequence === sequence && !stockValidation.isValid) {
            showValidation(stockValidation)
            // Revert the optimistic update
            pendingUpdateRef.current = { quantity: previousQuantity, sequence: sequenceRef.current++ }
            setCurrentQuantity(previousQuantity)
            quantityRef.current = previousQuantity
            onUpdateQuantity(item.menuItem.id, previousQuantity)
          }
        })
        .catch(() => {
          // Ignore stock check errors for better UX
        })
    }
  }

  const handleIncrement = () => {
    // Use functional update to always get the latest quantity value, ensuring no clicks are missed
    setCurrentQuantity(prev => {
      const newQuantity = prev + 1
      const previousQuantity = prev
      const sequence = ++sequenceRef.current
      
      // Update ref immediately
      quantityRef.current = newQuantity
      
      // Schedule the change to run after state update (not during render)
      setTimeout(() => {
        applyQuantityChange(newQuantity, previousQuantity, sequence)
      }, 0)
      
      return newQuantity
    })
  }

  const handleDecrement = () => {
    // Use functional update to always get the latest quantity value, ensuring no clicks are missed
    setCurrentQuantity(prev => {
      const newQuantity = prev - 1
      const previousQuantity = prev
      const sequence = ++sequenceRef.current
      
      // Update ref immediately
      quantityRef.current = newQuantity
      
      // Schedule the change to run after state update (not during render)
      setTimeout(() => {
        applyQuantityChange(newQuantity, previousQuantity, sequence)
      }, 0)
      
      return newQuantity
    })
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
          <span className="w-8 text-center text-sm font-medium tabular-nums">
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
