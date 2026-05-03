"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, MapPin, Clock } from "lucide-react"
import type { FavoriteRestaurantListItem } from "@/services/favorites.service"

export function FavoritesRestaurantList(props: {
  items: FavoriteRestaurantListItem[]
  onRemove: (restaurantId: string) => void | Promise<void>
}) {
  const { items, onRemove } = props
  const router = useRouter()

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs font-semibold text-slate-600">
              <th className="text-left px-4 py-3">Restaurant</th>
              <th className="text-left px-4 py-3">Address</th>
              <th className="text-left px-4 py-3">Hours</th>
              <th className="text-center px-4 py-3 w-[90px]">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {items.map((restaurant) => {
              const targetHref = `/restaurants/${encodeURIComponent(restaurant.id)}`

              return (
                <tr
                  key={restaurant.id}
                  className="hover:bg-slate-50 transition cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${restaurant.name}`}
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
                        {restaurant.avatarUrl ? (
                          <Image
                            src={restaurant.avatarUrl}
                            alt={restaurant.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700 font-semibold">
                            {restaurant.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-[13px] leading-4 font-semibold text-slate-900">
                            {restaurant.name}
                          </div>
                          {restaurant.isOpen ? (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Open
                            </span>
                          ) : (
                            <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              Closed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2 min-w-0 text-[13px] text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
                      <span className="truncate max-w-[420px]">{restaurant.address}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2 text-[13px] text-slate-700">
                      <Clock className="h-4 w-4 text-slate-400" aria-hidden />
                      <span className="truncate">
                        {restaurant.openHours && restaurant.closeHours ? `${restaurant.openHours}-${restaurant.closeHours}` : "—"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(ev) => {
                          ev.preventDefault()
                          ev.stopPropagation()
                          void onRemove(restaurant.id)
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

