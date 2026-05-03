"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import type { MenuItem } from "@/types/models"
import type { FavoriteFoodListItem } from "@/services/favorites.service"
import { formatPrice } from "@/lib/utils"
import { ShoppingCart, Trash2 } from "lucide-react"

function mapFavoriteFoodToMenuItem(food: FavoriteFoodListItem): MenuItem {
  return {
    id: food.id,
    name: food.name,
    description: food.description || "",
    price: Number(food.price) || 0,
    image: food.imageUrl || "",
    category: food.categoryName || "",
    isAvailable: Boolean(food.isAvailable),
    restaurantId: food.restaurantId,
    restaurantName: food.restaurantName || undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export function FavoritesFoodList(props: {
  items: FavoriteFoodListItem[]
  onRemove: (foodId: string) => void | Promise<void>
}) {
  const { items, onRemove } = props
  const { addToCart } = useCart()
  const router = useRouter()

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs font-semibold text-slate-600">
              <th className="text-left px-4 py-3">Food</th>
              <th className="text-left px-4 py-3">Restaurant</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-center px-4 py-3 w-[180px]">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((food) => {
              const targetHref = food.restaurantId
                ? `/restaurants/${encodeURIComponent(food.restaurantId)}?focusFood=${encodeURIComponent(food.id)}`
                : "/restaurants"

              const canAddToCart = Boolean(food.isAvailable) && Boolean(food.restaurantId)

              return (
                <tr
                  key={food.id}
                  className="hover:bg-slate-50 transition cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${food.name}`}
                  onClick={() => router.push(targetHref)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault()
                      router.push(targetHref)
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative size-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                        {food.imageUrl ? (
                          <Image
                            src={food.imageUrl}
                            alt={food.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 font-semibold">
                            {food.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-[13px] leading-4 font-semibold text-slate-900">{food.name}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                            {food.categoryName || "Food"}
                          </span>
                          {!food.isAvailable ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800 border border-amber-200">
                              Unavailable
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-[13px] font-medium text-slate-700 truncate max-w-[320px]">
                      {food.restaurantName || "Restaurant"}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="text-[13px] font-semibold text-slate-900 tabular-nums">
                      {formatPrice(Number(food.price) || 0)}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        disabled={!canAddToCart}
                        onClick={(ev) => {
                          ev.preventDefault()
                          ev.stopPropagation()
                          if (!canAddToCart) return
                          addToCart(mapFavoriteFoodToMenuItem(food), 1)
                        }}
                        className="h-8 px-3 text-[12px] gap-2 bg-orange-500 hover:bg-orange-600 text-white disabled:bg-orange-200 disabled:text-white"
                        aria-label="Add to cart"
                        title={canAddToCart ? "Add to cart" : "Unavailable"}
                      >
                        <ShoppingCart className="h-4 w-4" aria-hidden />
                        Add
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={(ev) => {
                          ev.preventDefault()
                          ev.stopPropagation()
                          void onRemove(food.id)
                        }}
                        className="h-8 w-8 p-0 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        aria-label="Remove from favorites"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

