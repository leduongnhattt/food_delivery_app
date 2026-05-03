"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Pagination } from "@/components/ui/pagination"
import { FavoritesFoodList } from "@/components/favorites/FavoritesFoodList"
import { FavoritesRestaurantList } from "@/components/favorites/FavoritesRestaurantList"
import { FavoritesService } from "@/services/favorites.service"
import { useFavoritesList } from "@/hooks/favorites-hooks"
import { useToast } from "@/contexts/toast-context"
import { Heart, Store, UtensilsCrossed, RefreshCw } from "lucide-react"

type TabKey = "restaurants" | "foods"

export default function FavoritesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [tab, setTab] = useState<TabKey>("foods")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<12 | 24 | 48>(12)

  const { loading, error, restaurants, foods, pagination, refresh } = useFavoritesList({
    type: tab,
    page,
    limit: pageSize,
  })

  const hasItems = useMemo(() => (tab === "restaurants" ? restaurants.length > 0 : foods.length > 0), [
    tab,
    restaurants.length,
    foods.length,
  ])

  async function handleRemoveRestaurant(restaurantId: string) {
    try {
      await FavoritesService.removeFavoriteRestaurant(restaurantId)
      showToast("Removed from favorites", "info")
      await refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove favorite"
      showToast(message, "error")
    }
  }

  async function handleRemoveFood(foodId: string) {
    try {
      await FavoritesService.removeFavoriteFood(foodId)
      showToast("Removed from favorites", "info")
      await refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove favorite"
      showToast(message, "error")
    }
  }

  function handleChangeTab(next: TabKey) {
    setTab(next)
    setPage(1)
  }

  const totalLabel = useMemo(() => {
    const total = Number.isFinite(pagination.total) ? pagination.total : 0
    const label = tab === "restaurants" ? "restaurants" : "foods"
    return `${total} ${label}`
  }, [pagination.total, tab])

  const headerIconBg = tab === "restaurants" ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"
  const tabOptions = useMemo(
    () => [
      { value: "restaurants", label: "Restaurants" },
      { value: "foods", label: "Foods" },
    ],
    [],
  )

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container py-8">
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Favorites</h1>
                <p className="text-gray-600">Manage your favorite restaurants and foods</p>
              </div>
              <Button
                type="button"
                onClick={() => void refresh()}
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
                <span>Refresh</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">Total favorites</p>
                    <p className="text-xl font-semibold text-gray-900 truncate">{totalLabel}</p>
                  </div>
                  <div className="p-2 flex items-center rounded justify-center size-12 shrink-0 bg-rose-100 text-rose-700">
                    <Heart className="size-5" />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-medium">View</p>
                    <p className="text-xl font-semibold text-gray-900 truncate">
                      {tab === "restaurants" ? "Restaurants" : "Foods"}
                    </p>
                  </div>
                  <div className={`p-2 flex items-center rounded justify-center size-12 shrink-0 ${headerIconBg}`}>
                    {tab === "restaurants" ? <Store className="size-5" /> : <UtensilsCrossed className="size-5" />}
                  </div>
                </div>
              </div>
            </div>

            <Card className="rounded-lg border border-slate-200 bg-white">
              <CardHeader className="pb-0">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="w-full sm:w-64">
                    <DropdownSelect
                      value={tab}
                      onChange={(next) => handleChangeTab(next as TabKey)}
                      options={tabOptions}
                      alignMenu="left"
                      aria-label="Favorites type"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                {error ? (
                  <div className="rounded-lg bg-rose-50 text-rose-800 text-sm px-3 py-2">{error}</div>
                ) : loading ? (
                  <div className="text-center text-slate-500 py-12">Loading…</div>
                ) : !hasItems ? (
                  <div className="rounded-lg border border-slate-200 bg-[#f9fbfc] px-6 py-14 text-center">
                    <div className="mx-auto size-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                      <Heart className="h-5 w-5" aria-hidden />
                    </div>
                    <h2 className="mt-4 text-[14px] leading-[18px] font-semibold text-slate-900">
                      No favorites yet
                    </h2>
                    <p className="mt-1 text-[13px] leading-[18px] font-medium text-slate-600">
                      {tab === "restaurants"
                        ? "Browse restaurants and tap the heart to add them here."
                        : "Browse foods and tap the heart to add them here."}
                    </p>
                    <div className="mt-4">
                      <Button type="button" onClick={() => router.push("/restaurants")}>
                        Browse restaurants
                      </Button>
                    </div>
                  </div>
                ) : tab === "restaurants" ? (
                  <FavoritesRestaurantList items={restaurants} onRemove={handleRemoveRestaurant} />
                ) : (
                  <FavoritesFoodList items={foods} onRemove={handleRemoveFood} />
                )}
              </CardContent>

              {!loading && !error && pagination.total > 0 ? (
                <Pagination
                  page={pagination.page}
                  pageSize={pageSize}
                  total={pagination.total}
                  pageSizeOptions={[12, 24, 48]}
                  onPageChange={(nextPage) => setPage(nextPage)}
                  onPageSizeChange={(nextSize) => {
                    setPageSize(nextSize as 12 | 24 | 48)
                    setPage(1)
                  }}
                />
              ) : null}
            </Card>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

