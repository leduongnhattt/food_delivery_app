'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { Minus, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { formatPrice, calculatePrice } from '@/lib/utils'
import { CartItem } from '@/types/models'
import { StockValidationPopup, useStockValidationPopup } from '@/components/ui/stock-validation-popup'
import { validateFoodStock } from '@/lib/stock-validation'
import { exceedsItemValueLimit, getOrderLimitLabel } from '@/lib/order-limit'
import { useTranslations } from '@/lib/i18n'
import { useState, useRef, useEffect } from 'react'

interface CartItemsProps {
  items: CartItem[]
  totalItems: number
  onChangeQuantity: (menuItemId: string, newQty: number) => void
  onRemove: (menuItemId: string) => void
}

export function CartItems({ items, totalItems, onChangeQuantity, onRemove }: CartItemsProps) {
  const { isOpen, validationResult, showValidation, hideValidation } = useStockValidationPopup()
  const { t, locale } = useTranslations()
  const [limitWarnings, setLimitWarnings] = useState<Record<string, boolean>>({})
  
  // Track local quantities for each item to handle rapid clicks
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    items.forEach(item => {
      initial[item.menuItem.id] = item.quantity
    })
    return initial
  })
  
  // Use refs to track latest quantities and pending updates with sequence numbers
  const quantityRefs = useRef<Record<string, number>>({})
  const pendingUpdates = useRef<Record<string, { quantity: number; sequence: number } | null>>({})
  const sequenceRefs = useRef<Record<string, number>>({})
  const itemsRef = useRef(items)

  // Sync local quantities with props when they change from server
  useEffect(() => {
    // Update refs and local quantities for all items
    const currentItemIds = new Set(items.map(item => item.menuItem.id))
    
    setLocalQuantities(prev => {
      const newLocalQuantities: Record<string, number> = {}
      let hasChanges = false
      
      items.forEach(item => {
        const menuItemId = item.menuItem.id
        
        // Initialize refs if needed
        if (!quantityRefs.current[menuItemId]) {
          quantityRefs.current[menuItemId] = item.quantity
        }
        if (!sequenceRefs.current[menuItemId]) {
          sequenceRefs.current[menuItemId] = 0
        }
        if (pendingUpdates.current[menuItemId] === undefined) {
          pendingUpdates.current[menuItemId] = null
        }
        
        // Only sync if there's no pending update for this item
        if (pendingUpdates.current[menuItemId] === null) {
          quantityRefs.current[menuItemId] = item.quantity
          newLocalQuantities[menuItemId] = item.quantity
          if (prev[menuItemId] !== item.quantity) {
            hasChanges = true
          }
        } else if (pendingUpdates.current[menuItemId]?.quantity === item.quantity) {
          // Server caught up with our pending update
          pendingUpdates.current[menuItemId] = null
          quantityRefs.current[menuItemId] = item.quantity
          newLocalQuantities[menuItemId] = item.quantity
          if (prev[menuItemId] !== item.quantity) {
            hasChanges = true
          }
        } else {
          // Keep current local quantity if there's a pending update
          newLocalQuantities[menuItemId] = prev[menuItemId] ?? item.quantity
        }
      })
      
      // Check if any items were removed
      Object.keys(prev).forEach(id => {
        if (!currentItemIds.has(id)) {
          hasChanges = true
          delete quantityRefs.current[id]
          delete pendingUpdates.current[id]
          delete sequenceRefs.current[id]
        }
      })
      
      return hasChanges ? newLocalQuantities : prev
    })
    
    itemsRef.current = items
  }, [items])

  const applyQuantityChange = (menuItemId: string, newQuantity: number, previousQuantity: number, price: number, sequence: number) => {
    // Only process if this is still the latest update
    if (pendingUpdates.current[menuItemId] && pendingUpdates.current[menuItemId]!.sequence > sequence) {
      return // A newer update has already been processed
    }

    if (newQuantity <= 0) {
      onRemove(menuItemId)
      return
    }

    // Enforce monetary limit per item total
    if (exceedsItemValueLimit(price, newQuantity)) {
      setLimitWarnings((prev) => ({ ...prev, [menuItemId]: true }))
      return
    }
    setLimitWarnings((prev) => ({ ...prev, [menuItemId]: false }))

    // Track the pending update with sequence number
    pendingUpdates.current[menuItemId] = { quantity: newQuantity, sequence }

    // Optimistic update - send to server immediately (called after setState)
    onChangeQuantity(menuItemId, newQuantity)

    // Check stock in background (only for increases) - don't block UI
    if (newQuantity > previousQuantity) {
      validateFoodStock(menuItemId, newQuantity)
        .then(stockValidation => {
          // Only revert if this is still the latest update
          if (pendingUpdates.current[menuItemId]?.sequence === sequence && !stockValidation.isValid) {
            showValidation(stockValidation)
            // Revert the optimistic update
            const revertSequence = ++sequenceRefs.current[menuItemId]
            pendingUpdates.current[menuItemId] = { quantity: previousQuantity, sequence: revertSequence }
            setLocalQuantities(prev => ({ ...prev, [menuItemId]: previousQuantity }))
            quantityRefs.current[menuItemId] = previousQuantity
            onChangeQuantity(menuItemId, previousQuantity)
          }
        })
        .catch(() => {
          // Ignore stock check errors for better UX
        })
    }
  }

  const handleIncrement = (menuItemId: string, price: number) => {
    setLocalQuantities(prev => {
      const currentQty = prev[menuItemId] ?? quantityRefs.current[menuItemId] ?? 0
      const newQuantity = currentQty + 1
      const previousQuantity = currentQty
      
      // Initialize sequence if needed
      if (!sequenceRefs.current[menuItemId]) {
        sequenceRefs.current[menuItemId] = 0
      }
      const sequence = ++sequenceRefs.current[menuItemId]
      
      // Update ref immediately
      quantityRefs.current[menuItemId] = newQuantity
      
      // Schedule the change to run after state update (not during render)
      setTimeout(() => {
        applyQuantityChange(menuItemId, newQuantity, previousQuantity, price, sequence)
      }, 0)
      
      return { ...prev, [menuItemId]: newQuantity }
    })
  }

  const handleDecrement = (menuItemId: string, price: number) => {
    setLocalQuantities(prev => {
      const currentQty = prev[menuItemId] ?? quantityRefs.current[menuItemId] ?? 0
      const newQuantity = currentQty - 1
      const previousQuantity = currentQty
      
      // Initialize sequence if needed
      if (!sequenceRefs.current[menuItemId]) {
        sequenceRefs.current[menuItemId] = 0
      }
      const sequence = ++sequenceRefs.current[menuItemId]
      
      // Update ref immediately
      quantityRefs.current[menuItemId] = newQuantity
      
      // Schedule the change to run after state update (not during render)
      setTimeout(() => {
        applyQuantityChange(menuItemId, newQuantity, previousQuantity, price, sequence)
      }, 0)
      
      return { ...prev, [menuItemId]: newQuantity }
    })
  }

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Your Order</CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {totalItems} items
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.menuItem.id} className="p-3 bg-white rounded-lg border border-orange-100 space-y-2">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0 shadow-sm">
                  <Image src={item.menuItem.image} alt={item.menuItem.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{item.menuItem.name}</h3>
                      <div className="text-xs text-gray-500">{formatPrice(item.menuItem.price)} each</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleDecrement(item.menuItem.id, item.menuItem.price)} className="w-7 h-7 p-0 border-orange-200 hover:bg-orange-50">
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-7 text-center font-medium text-sm tabular-nums">
                        {localQuantities[item.menuItem.id] ?? item.quantity}
                      </span>
                      <Button size="sm" variant="outline" onClick={() => handleIncrement(item.menuItem.id, item.menuItem.price)} className="w-7 h-7 p-0 border-orange-200 hover:bg-orange-50">
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => onRemove(item.menuItem.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50" aria-label="Remove item">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="font-bold text-sm text-gray-900">
                    {formatPrice(calculatePrice(item.menuItem.price, localQuantities[item.menuItem.id] ?? item.quantity))}
                  </p>
                </div>
              </div>
              {limitWarnings[item.menuItem.id] && (
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
          ))}
        </div>
      </CardContent>

      <StockValidationPopup
        isOpen={isOpen}
        onClose={hideValidation}
        validationResult={validationResult}
      />
    </Card>
  )
}


