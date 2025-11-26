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
  const router = useRouter()

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  };
  
  const handleOrderFood = (foodId: string) => {
    console.log('Ordering:', foodId);
  };

  const handleCategoryClick = (category: string) => {
    // Navigate to search page with category filter
    router.push(`/search?q=${encodeURIComponent(category)}`)
  };

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
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">
            🍴 Food Categories
          </h2>
          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`group w-full rounded-xl border ${getCategoryTone(cat.name)} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400`}
                >
                  <div className="px-4 py-4 flex flex-col items-center justify-center">
                    <div className="text-3xl mb-2 select-none group-hover:scale-110 transition-transform">{getCategoryIcon(cat.name)}</div>
                    <div className="font-semibold text-sm truncate">{cat.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Foods Section */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <FoodsSlideMenu
            title="🍽️ Popular Foods"
            onOrderFood={handleOrderFood}
            useDatabase={true}
            limit={10}
            className="mb-0"
          />
        </div>
      </section>


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
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-800">
            ⭐ Why Choose HanalaFood?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <CardTitle className="text-gray-800">Lightning Fast Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Delivery in 30-45 minutes. We prioritize speed without compromising food quality.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <CardTitle className="text-gray-800">Quality Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Partner with the best restaurants in the city. From local favorites to international cuisine.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <CardTitle className="text-gray-800">Easy Ordering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
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
