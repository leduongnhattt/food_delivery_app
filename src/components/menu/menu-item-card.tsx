import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingCart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { MenuItem } from '@/types/models'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth-helpers'
import { useFavoriteFood } from '@/hooks/favorites-hooks'

interface MenuItemCardProps {
  menuItem: MenuItem
  onAddToCart: (menuItem: MenuItem) => void
}

export function MenuItemCard({ menuItem, onAddToCart }: MenuItemCardProps) {
  const router = useRouter()
  const { isFavorite, loading: favoriteLoading, toggle } = useFavoriteFood(menuItem.id)

  async function handleToggleFavorite() {
    if (!isAuthenticated()) {
      router.push('/signin')
      return
    }
    await toggle()
  }

  return (
    <Card className="overflow-hidden border border-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      <div className="relative h-40 w-full">
        <Image
          src={menuItem.image}
          alt={menuItem.name}
          fill
          className="object-cover"
        />
        <button
          type="button"
          onClick={() => void handleToggleFavorite()}
          disabled={favoriteLoading}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-2 right-2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md ring-1 ring-black/10 transition"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-600'}`} />
        </button>
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
