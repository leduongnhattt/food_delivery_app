import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { MenuItem } from '@/types/models'

interface MenuItemCardProps {
  menuItem: MenuItem
  onAddToCart: (menuItem: MenuItem) => void
}

export function MenuItemCard({ menuItem, onAddToCart }: MenuItemCardProps) {
  return (
    <Card className="overflow-hidden border border-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      <div className="relative h-40 w-full">
        <Image
          src={menuItem.image}
          alt={menuItem.name}
          fill
          className="object-cover"
        />
        {!menuItem.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3 flex-1 min-h-[76px]">
        <CardTitle className="text-base font-semibold text-gray-900">{menuItem.name}</CardTitle>
        <p className="text-sm text-gray-600 line-clamp-2">
          {menuItem.description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0 mt-auto">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">
            {formatPrice(menuItem.price)}
          </span>
          <Button
            size="sm"
            onClick={() => onAddToCart(menuItem)}
            disabled={!menuItem.isAvailable}
            className={`rounded-full px-4 py-2 shadow-md transition-all duration-200 ${
              menuItem.isAvailable
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-lg hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {menuItem.isAvailable ? (
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Add to cart
              </span>
            ) : (
              'Unavailable'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
