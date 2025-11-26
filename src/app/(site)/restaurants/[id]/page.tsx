'use client'
import React from 'react'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { MenuItem } from '@/types/models'
import { useCart } from '@/hooks/use-cart'
import { useRestaurantDetail, useRestaurantCategoryNav } from '@/hooks/use-restaurant-detail'
import EnterpriseHero from '@/components/restaurant/EnterpriseHero'
import ReviewsSection from '@/components/restaurant/ReviewsSection'
import CategoryPills from '@/components/restaurant/CategoryPills'
import RestaurantMenuSection from '@/components/restaurant/RestaurantMenuSection'


interface RestaurantPageProps {
  params: Promise<{
    id: string
  }>
}

export default function RestaurantPage({ params }: RestaurantPageProps) {
  const { addToCart } = useCart()

  // Unwrap params using React.use()
  const { id } = React.use(params)

  const { restaurant, items: menuItems, loading } = useRestaurantDetail(id)
  const { activeCategory, categoryRefs, categories: catList, handleSelectCategory } = useRestaurantCategoryNav(menuItems)

  if (!loading && !restaurant) {
    notFound()
  }

  const handleAddToCart = (menuItem: MenuItem) => {
    const enriched: MenuItem = {
      ...menuItem,
      restaurantName: menuItem.restaurantName || restaurant!.name,
      restaurantId: menuItem.restaurantId || restaurant!.id,
    }
    addToCart(enriched, 1)
  }

  const categories = catList

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <EnterpriseHero 
        name={restaurant!.name}
        description={restaurant!.description}
        avatarUrl={restaurant!.avatarUrl}
        rating={restaurant!.rating}
        isOpen={restaurant!.isOpen}
        phone={restaurant!.phone}
        address={restaurant!.address}
        deliveryTime={restaurant!.deliveryTime}
        openHours={restaurant!.openHours}
        closeHours={restaurant!.closeHours}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Menu Section */}
        <div className="mb-8">
          <CategoryPills 
            categories={categories}
            active={activeCategory}
            getCount={(c) => menuItems.filter(i => i.category === c).length}
            onSelect={handleSelectCategory}
          />

          {/* Section Header */}
          <div className="flex items-center justify-between mb-6 mt-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Menu</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {menuItems.length} items
              </Badge>
            </div>
          </div>

          {categories.map((category) => (
            <RestaurantMenuSection
              key={category}
              category={category}
              items={menuItems.filter(item => item.category === category)}
              onAddToCart={handleAddToCart}
              registerRef={(el) => { categoryRefs.current[category] = el }}
            />
          ))}
        </div>

        <ReviewsSection 
          rating={restaurant!.rating}
          reviews={[
            { id: '1', author: 'Anonymous', rating: 4, content: 'Great desserts and quick delivery. Will order again!', images: ['/static/rev1.jpg','/static/rev2.jpg'] },
            { id: '2', author: 'Nguyen', rating: 3, content: 'Tasty, but the salad could be fresher.', images: ['/static/rev3.jpg'] },
            { id: '3', author: 'Linh', rating: 5, content: 'Excellent service and the pasta was amazing! Highly recommended.', images: ['/static/rev4.jpg'] },
          ]}
        />
      </div>
    </div>
  )
}
