import { Restaurant, MenuItem } from '@/types/models';
import { SAMPLE_FOODS } from './sample-foods';

// Sample restaurant data
export const SAMPLE_RESTAURANTS: Restaurant[] = [
    {
        id: '1',
        name: 'Pizza Palace',
        description: 'Authentic Italian pizza with fresh ingredients and traditional recipes. We use only the finest ingredients imported directly from Italy to create the most delicious pizzas you\'ve ever tasted.',
        address: '123 Main St, Ho Chi Minh City',
        phone: '+84 123 456 789',
        avatarUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop',
        rating: 4.5,
        deliveryTime: '30-45 min',
        minimumOrder: 50000,
        isOpen: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: '2',
        name: 'Sweet Dreams Bakery',
        description: 'Indulge in our heavenly desserts and pastries. From rich chocolate cakes to delicate pastries, we bring you the finest sweet treats made with love and premium ingredients.',
        address: '456 Sweet Ave, Ho Chi Minh City',
        phone: '+84 987 654 321',
        avatarUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=400&fit=crop',
        rating: 4.8,
        deliveryTime: '25-35 min',
        minimumOrder: 30000,
        isOpen: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: '3',
        name: 'Morning Glory Cafe',
        description: 'Start your day right with our delicious breakfast options. Fresh pancakes, crispy bacon, and aromatic coffee to fuel your morning adventures.',
        address: '789 Breakfast Blvd, Ho Chi Minh City',
        phone: '+84 555 123 456',
        avatarUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=400&fit=crop',
        rating: 4.3,
        deliveryTime: '20-30 min',
        minimumOrder: 40000,
        isOpen: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: '4',
        name: 'Sandwich Station',
        description: 'Fresh, crispy sandwiches made to order. We use premium ingredients and artisanal bread to create the perfect sandwich experience.',
        address: '321 Sandwich St, Ho Chi Minh City',
        phone: '+84 777 888 999',
        avatarUrl: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=800&h=400&fit=crop',
        rating: 4.2,
        deliveryTime: '15-25 min',
        minimumOrder: 35000,
        isOpen: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: '5',
        name: 'Spice Garden Thai',
        description: 'Authentic Thai cuisine with bold flavors and aromatic spices. Experience the true taste of Thailand with our traditional recipes and fresh ingredients.',
        address: '654 Thai Lane, Ho Chi Minh City',
        phone: '+84 333 444 555',
        avatarUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&h=400&fit=crop',
        rating: 4.6,
        deliveryTime: '35-45 min',
        minimumOrder: 60000,
        isOpen: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

// Convert sample foods to menu items for restaurants
export const getMenuItemsForRestaurant = (restaurantId: string): MenuItem[] => {
    return SAMPLE_FOODS
        .filter(food => food.restaurantId === restaurantId)
        .map(food => ({
            id: food.foodId,
            name: food.dishName,
            description: food.description,
            price: Math.round(food.price * 1000), // Convert to VND (multiply by 1000)
            image: food.imageUrl || '/api/placeholder/300/200',
            category: food.menu.category,
            isAvailable: food.stock > 0,
            restaurantId: food.restaurantId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
};

// Get restaurant by ID
export const getRestaurantById = (id: string): Restaurant | undefined => {
    return SAMPLE_RESTAURANTS.find(restaurant => restaurant.id === id);
};

