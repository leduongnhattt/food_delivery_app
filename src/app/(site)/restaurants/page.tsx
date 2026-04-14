import { RestaurantCard } from '@/components/restaurant/restaurant-card'
import { useRestaurantList } from '@/hooks/use-restaurant-list'
import { Loading } from '@/components/ui/loading'
import { ErrorDisplay } from '@/components/ui/error-display'

export default function RestaurantsPage() {
  const { restaurants, loading, error, refetch } = useRestaurantList({ page: 1, limit: 24 })

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Restaurants</h1>
        <p className="text-muted-foreground">
          Discover the best restaurants in your area
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Loading />
        </div>
      ) : error ? (
        <div className="py-10">
          <ErrorDisplay error={error} onClose={refetch} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  )
}
