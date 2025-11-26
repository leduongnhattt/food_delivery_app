"use client"
import { Badge } from '@/components/ui/badge'
import { MenuItem } from '@/types/models'
import { MenuItemCard } from '@/components/menu/menu-item-card'

interface Props {
  category: string
  items: MenuItem[]
  onAddToCart: (menuItem: MenuItem) => void
  registerRef?: (el: HTMLDivElement | null) => void
}

export default function RestaurantMenuSection({ category, items, onAddToCart, registerRef }: Props) {
  return (
    <div className="mb-12" ref={registerRef}>
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-900">{category}</h3>
        <div className="flex-1 h-px bg-gray-200" />
        <Badge variant="outline">{items.length} items</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <MenuItemCard key={item.id} menuItem={item} onAddToCart={onAddToCart} />
        ))}
      </div>
    </div>
  )
}


