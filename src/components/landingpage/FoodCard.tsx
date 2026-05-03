import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { Food } from '@/types/models';
import { formatPrice } from '@/lib/utils';
import { HighlightText } from '@/components/ui/highlight-text';
import { Heart } from 'lucide-react'
import { isAuthenticated } from '@/lib/auth-helpers'
import { useFavoriteFood } from '@/hooks/favorites-hooks'

interface FoodCardProps {
  food: Food;
  onOrderNow: (foodId: string) => void;
  searchQuery?: string;
}

const FoodCard: React.FC<FoodCardProps> = ({ food, onOrderNow, searchQuery = '' }) => {
  const router = useRouter()
  const { isFavorite, loading: favoriteLoading, toggle } = useFavoriteFood(food.foodId)

  const handleOrderClick = (): void => {
    onOrderNow(food.foodId);
  };

  async function handleToggleFavorite() {
    if (!isAuthenticated()) {
      router.push('/signin')
      return
    }
    await toggle()
  }

  // Defensive availability: prefer explicit isAvailable; fallback to true (do not infer from stock)
  const availableFlag = (food as any)?.isAvailable
  const available = (availableFlag !== undefined) ? Boolean(availableFlag) : true
  const description = (food.description ?? '').trim()
  const [descOpen, setDescOpen] = React.useState(false)
  const descRef = React.useRef<HTMLParagraphElement | null>(null)
  const [descOverflow, setDescOverflow] = React.useState(false)

  React.useLayoutEffect(() => {
    const el = descRef.current
    if (!el || !description) {
      setDescOverflow(false)
      return
    }

    const check = () => {
      // If clamped, scrollHeight will exceed clientHeight.
      setDescOverflow(el.scrollHeight - el.clientHeight > 1)
    }

    check()
    const ro = new ResizeObserver(() => check())
    ro.observe(el)
    return () => ro.disconnect()
  }, [description])

  React.useEffect(() => {
    if (!descOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDescOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [descOpen])

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full h-full flex flex-col transform-gpu transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-orange-200">
      {/* Food Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {food.imageUrl ? (
          <Image 
            src={food.imageUrl}
            alt={food.dishName || 'Food item'}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs" style={{ aspectRatio: "1 / 1" }}>
            No Image
          </div>
        )}
        <button
          type="button"
          onClick={(ev) => {
            ev.preventDefault()
            ev.stopPropagation()
            void handleToggleFavorite()
          }}
          disabled={favoriteLoading}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-2 right-2 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md ring-1 ring-black/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-700'}`} />
        </button>
        {/* No stock hint badge; availability is controlled by flag */}
        {!available && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
        Out of Stock
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-1 flex-col">
        {/* Food Name */}
        <h3 className="font-semibold text-base text-gray-900 mb-0.5 line-clamp-1">
          <HighlightText 
            text={food.dishName} 
            searchQuery={searchQuery}
          />
        </h3>

        {/* Category and Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            {food.menu?.category || 'Food'}
          </span>
        </div>

        {/* Description */}
        <div className="relative mb-3">
          <p
            ref={descRef}
            className="text-gray-600 text-xs line-clamp-3 min-h-[54px]"
            title={description || undefined}
            aria-label={description || undefined}
          >
            {description}
          </p>

          <div className="mt-1 min-h-[16px] flex items-center justify-end">
            {descOverflow ? (
              <button
                type="button"
                onClick={() => setDescOpen(true)}
                className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                aria-haspopup="dialog"
                aria-expanded={descOpen}
              >
                Read more
              </button>
            ) : null}
          </div>
        </div>

        {/* Price and Order Button */}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(food.price)}
          </span>
          <button 
            onClick={handleOrderClick}
            disabled={!available}
            className={`h-9 px-4 rounded-full font-semibold text-sm transition-all duration-200 active:scale-[0.98] ${
              !available 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-md'
            }`}
          >
            {!available ? 'Sold Out' : 'Order Now'}
          </button>
        </div>
      </div>

      {descOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close description"
            onClick={() => setDescOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {food.dishName}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {food.menu?.category || 'Food'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDescOpen(false)}
                className="shrink-0 h-8 w-8 rounded-full hover:bg-gray-100 text-gray-600 grid place-items-center"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="px-4 py-4 max-h-[60vh] overflow-auto">
              <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                {description}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FoodCard;