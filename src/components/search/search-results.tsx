"use client"

import { SearchResult } from '@/services/search.service'
import FoodCard from '@/components/landingpage/FoodCard'
import { Food } from '@/types/models'
import { Search, AlertCircle, Loader2 } from 'lucide-react'

interface SearchResultsProps {
  searchResults: SearchResult
  loading: boolean
  error: string | null
  onAddToCart?: (food: Food) => void
}

const EmptyState = ({ icon: Icon, title, description, action }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Icon className="w-12 h-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-center mb-4">{description}</p>
    {action}
  </div>
)

const BackToHomeButton = () => (
  <button 
    onClick={() => window.location.href = '/'}
    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
  >
    Back to Home
  </button>
)

export function SearchResults({ searchResults, loading, error, onAddToCart }: SearchResultsProps) {
  if (loading) {
    return (
      <EmptyState
        icon={Loader2}
        title=""
        description="Searching for foods..."
        action={<Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-4" />}
      />
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Search Error"
        description={error}
      />
    )
  }

  if (!searchResults.query) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
        <p className="text-gray-600">Enter a food name to find delicious meals</p>
      </div>
    )
  }

  if (searchResults.foods.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No Results Found"
        description={`No foods found for "${searchResults.query}". Try a different search term.`}
        action={<BackToHomeButton />}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
          <p className="text-sm text-gray-600">
            Found {searchResults.total} food{searchResults.total !== 1 ? 's' : ''} for "{searchResults.query}"
            {searchResults.cached && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Cached</span>
            )}
          </p>
        </div>
        <BackToHomeButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {searchResults.foods.map((food, index) => (
          <FoodCard
            key={`${food.foodId}-${index}`}
            food={food}
            searchQuery={searchResults.query}
            onOrderNow={() => onAddToCart?.(food)}
          />
        ))}
      </div>
    </div>
  )
}
