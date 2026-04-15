'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import HeroSection from '@/components/landingpage/HeroSection'
import FoodsSlideMenu from '@/components/landingpage/FoodsSlideMenu'
import RestaurantMenu from '@/components/landingpage/RestaurantMenu'
import HealthChatbot from '@/components/health/HealthChatbot'
import React from 'react'
import { CategoryService, type CategoryDto } from '@/services/category.service'
import { getCategoryIcon, getCategoryTone } from '@/lib/category-icons'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [categories, setCategories] = React.useState<CategoryDto[]>([])
  const [loadingCategories, setLoadingCategories] = React.useState(true)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [categoryPickerOpen, setCategoryPickerOpen] = React.useState(false)
  const router = useRouter()
  const popularFoodsRef = React.useRef<HTMLElement | null>(null)

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  };
  
  const handleOrderFood = (foodId: string) => {
    console.log('Ordering:', foodId);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    setCategoryPickerOpen(false)
    window.requestAnimationFrame(() => {
      popularFoodsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const clearCategory = () => {
    setSelectedCategory(null)
    setCategoryPickerOpen(false)
    window.requestAnimationFrame(() => {
      popularFoodsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  React.useEffect(() => {
    let mounted = true
    CategoryService.getAllDebounced().then(list => {
      if (mounted) setCategories(list)
    }).finally(() => mounted && setLoadingCategories(false))
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <HeroSection 
        onSearch={handleSearch}
        placeholder="Search for your favorite food..."
      />

      {/* Food Categories - Quick Access */}
      <section className="py-5 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-3 mb-3 relative">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              🍴 Food Categories
            </h2>
          </div>

          {loadingCategories ? (
            <div className="max-w-6xl mx-auto">
              <div className="overflow-x-auto overflow-y-visible scrollbar-hide py-1 px-1">
                <div className="w-max mx-auto flex gap-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-12 w-20 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="max-w-6xl mx-auto">
                <div className="overflow-x-auto overflow-y-visible scrollbar-hide py-1 px-1">
                  <div className="w-max mx-auto flex gap-2">
                  <button
                    type="button"
                    onClick={clearCategory}
                    className={[
                      "flex-shrink-0 h-14 px-4 rounded-xl border transition-shadow focus:outline-none focus:ring-2 focus:ring-orange-400",
                      "flex flex-col items-center justify-center gap-1 min-w-[84px]",
                      selectedCategory == null
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-200 bg-white hover:shadow-sm",
                    ].join(" ")}
                  >
                    <span className="text-lg leading-none">🍽️</span>
                    <span className="text-xs font-semibold truncate max-w-28">All</span>
                  </button>

                  {categories.slice(0, 6).map((cat) => {
                    const active = selectedCategory === cat.name
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.name)}
                        className={[
                          "flex-shrink-0 h-14 px-4 rounded-xl border transition-shadow focus:outline-none focus:ring-2 focus:ring-orange-400",
                          "flex flex-col items-center justify-center gap-1 min-w-[84px]",
                          active
                            ? "border-orange-400 bg-orange-50 text-orange-700"
                            : `bg-white hover:shadow-sm ${getCategoryTone(cat.name)}`,
                        ].join(" ")}
                        title={cat.name}
                      >
                        <span className="text-lg leading-none">{getCategoryIcon(cat.name)}</span>
                        <span className="text-xs font-semibold text-gray-900 truncate max-w-32">{cat.name}</span>
                      </button>
                    )
                  })}

                  {categories.length > 6 ? (
                    <button
                      type="button"
                      onClick={() => setCategoryPickerOpen(v => !v)}
                      className="flex-shrink-0 h-14 px-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-orange-400 flex flex-col items-center justify-center gap-1 min-w-[84px]"
                    >
                      <span className="text-lg leading-none">⋯</span>
                      <span className="text-xs font-semibold text-gray-900">More</span>
                    </button>
                  ) : null}
                  </div>
                </div>
              </div>

              {categoryPickerOpen ? (
                <div className="absolute right-0 mt-2 w-[min(520px,calc(100vw-2rem))] rounded-2xl border border-gray-200 bg-white shadow-xl z-20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-900">All categories</div>
                    <button
                      type="button"
                      onClick={() => setCategoryPickerOpen(false)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-56 overflow-auto pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat) => {
                        const active = selectedCategory === cat.name
                        return (
                          <button
                            key={`picker-${cat.id}`}
                            type="button"
                            onClick={() => handleCategoryClick(cat.name)}
                            className={[
                              "w-full rounded-xl border px-3 py-2 text-left hover:shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-orange-400",
                              active ? "border-orange-300 bg-orange-50" : getCategoryTone(cat.name),
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base leading-none">{getCategoryIcon(cat.name)}</span>
                              <span className="text-xs font-semibold text-gray-900 truncate">{cat.name}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Popular Foods Section */}
      <section ref={popularFoodsRef} className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <FoodsSlideMenu
            title="🍽️ Popular Foods"
            onOrderFood={handleOrderFood}
            useDatabase={true}
            category={selectedCategory || undefined}
            limit={10}
            className="mb-0"
          />
        </div>
      </section>

      {/* Soft divider */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-gray-200" />
            <div className="h-2 w-2 rounded-full bg-gray-300" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gray-300 to-gray-200" />
          </div>
        </div>
      </div>


      {/* Restaurants Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <RestaurantMenu
            className="mb-0"
            limit={8}
            showViewAll={true}
          />
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-10 text-gray-800">
            ⭐ Why Choose HanalaFood?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <CardTitle className="text-gray-800 text-lg">Lightning Fast Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Delivery in 30-45 minutes. We prioritize speed without compromising food quality.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <CardTitle className="text-gray-800 text-lg">Quality Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Partner with the best restaurants in the city. From local favorites to international cuisine.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <CardTitle className="text-gray-800 text-lg">Easy Ordering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Simple and intuitive ordering process. Track your order in real-time from kitchen to doorstep.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Health Chatbot */}
      <HealthChatbot />
    </div>
  )
}
