"use client"

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSearch } from '@/hooks/use-search'
import { SearchResults } from '@/components/search/search-results'
import HeroSection from '@/components/landingpage/HeroSection'
import { Food } from '@/types/models'
import { useCart } from '@/hooks/use-cart'

const createMenuItem = (food: Food) => ({
  id: food.foodId,
  name: food.dishName,
  description: food.description,
  price: food.price,
  image: food.imageUrl,
  category: food.menu.category,
  isAvailable: food.stock > 0,
  restaurantId: food.restaurantId,
  restaurantName: 'Restaurant',
  createdAt: new Date(),
  updatedAt: new Date(),
})

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { searchResults, loading, error, searchFoods, clearResults } = useSearch()
  const { addToCart } = useCart()

  useEffect(() => {
    const query = searchParams.get('q') || ''
    if (query) {
      searchFoods(query)
    }
  }, [searchParams, searchFoods])

  const handleSearch = (query: string) => {
    if (query.trim()) {
      const params = new URLSearchParams()
      params.set('q', query)
      router.push(`/search?${params.toString()}`)
    } else {
      clearResults()
    }
  }

  const handleAddToCart = (food: Food) => {
    addToCart(createMenuItem(food), 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection
        onSearch={handleSearch}
        placeholder="Search for foods..."
        className="mb-8"
      />

      <div className="container mx-auto px-4 py-8">
        <SearchResults
          searchResults={searchResults}
          loading={loading}
          error={error}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  )
}
