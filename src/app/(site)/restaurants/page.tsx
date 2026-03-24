import { RestaurantCard } from '@/components/restaurant/restaurant-card'
import { Restaurant } from '@/types/models'

// Mock data - replace with actual API call
const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Pizza Palace',
    description: 'Authentic Italian pizza with fresh ingredients and traditional recipes.',
    address: '123 Main St, Ho Chi Minh City',
    phone: '+84 123 456 789',
    avatarUrl: '/api/placeholder/400/300',
    rating: 4.5,
    deliveryTime: '30-45 min',
    minimumOrder: 50000,
    isOpen: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Sushi Master',
    description: 'Fresh sushi and Japanese cuisine prepared by expert chefs.',
    address: '456 Nguyen Hue, Ho Chi Minh City',
    phone: '+84 987 654 321',
    avatarUrl: '/api/placeholder/400/300',
    rating: 4.8,
    deliveryTime: '25-40 min',
    minimumOrder: 80000,
    isOpen: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Pho Delicious',
    description: 'Traditional Vietnamese pho with rich broth and tender meat.',
    address: '789 Le Loi, Ho Chi Minh City',
    phone: '+84 555 123 456',
    avatarUrl: '/api/placeholder/400/300',
    rating: 4.3,
    deliveryTime: '20-35 min',
    minimumOrder: 40000,
    isOpen: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function RestaurantsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Restaurants</h1>
        <p className="text-muted-foreground">
          Discover the best restaurants in your area
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRestaurants.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>
    </div>
  )
}
