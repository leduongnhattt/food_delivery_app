// Sample food data for development and testing
import { Food } from '@/types/models';

export const SAMPLE_FOODS: Food[] = [
    {
        foodId: 'food-1',
        dishName: 'Hamburger',
        price: 3.98,
        stock: 15,
        description: 'Juicy beef patty with fresh lettuce, tomatoes, and special sauce',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop',
        restaurantId: '1',
        menu: {
            menuId: 'menu-1',
            category: 'Main Dish'
        },
    },
    {
        foodId: 'food-2',
        dishName: 'Toffee\'s Cake',
        price: 4.00,
        stock: 8,
        description: 'Rich chocolate cake with toffee sauce and fresh blueberries',
        imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop',
        restaurantId: '2',
        menu: {
            menuId: 'menu-2',
            category: 'Dessert'
        },
    },
    {
        foodId: 'food-3',
        dishName: 'Pancake',
        price: 1.99,
        stock: 12,
        description: 'Fluffy pancakes served with maple syrup and butter',
        imageUrl: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=300&h=200&fit=crop',
        restaurantId: '3',
        menu: {
            menuId: 'menu-3',
            category: 'Breakfast'
        },
    },
    {
        foodId: 'food-4',
        dishName: 'Crispy Sandwich',
        price: 3.00,
        stock: 6,
        description: 'Grilled sandwich with crispy bacon and melted cheese',
        imageUrl: '',
        restaurantId: '4',
        menu: {
            menuId: 'menu-4',
            category: 'Sandwich'
        },
    },
    {
        foodId: 'food-5',
        dishName: 'Thai Soup',
        price: 2.79,
        stock: 10,
        description: 'Spicy and aromatic Thai soup with coconut milk and herbs',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop',
        restaurantId: '5',
        menu: {
            menuId: 'menu-5',
            category: 'Soup'
        },
    },
    {
        foodId: 'food-6',
        dishName: 'Spaghetti Carbonara',
        price: 8.50,
        stock: 0,
        description: 'Classic Italian pasta with eggs, cheese, and pancetta',
        imageUrl: '',
        restaurantId: '1',
        menu: {
            menuId: 'menu-1',
            category: 'Main Dish'
        },
    },
    {
        foodId: 'food-7',
        dishName: 'Caesar Salad',
        price: 5.99,
        stock: 20,
        description: 'Fresh romaine lettuce with parmesan cheese and croutons',
        imageUrl: 'https://images.unsplash.com/photo-1512852939750-1305098529bf?w=300&h=200&fit=crop',
        restaurantId: '1',
        menu: {
            menuId: 'menu-1',
            category: 'Main Dish'
        },
    },
    {
        foodId: 'food-8',
        dishName: 'Fish & Chips',
        price: 7.25,
        stock: 3,
        description: 'Crispy battered fish served with golden french fries',
        imageUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=300&h=200&fit=crop',
        restaurantId: '1',
        menu: {
            menuId: 'menu-1',
            category: 'Main Dish'
        },
    },
    {
        foodId: 'food-9',
        dishName: 'Grilled Chicken',
        price: 6.50,
        stock: 8,
        description: 'Tender grilled chicken breast with herbs and spices',
        imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&h=200&fit=crop',
        restaurantId: '1',
        menu: {
            menuId: 'menu-1',
            category: 'Main Dish'
        },
    },
    {
        foodId: 'food-10',
        dishName: 'Chocolate Brownie',
        price: 3.50,
        stock: 15,
        description: 'Rich and fudgy chocolate brownie with vanilla ice cream',
        imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300&h=200&fit=crop',
        restaurantId: '2',
        menu: {
            menuId: 'menu-2',
            category: 'Dessert'
        },
    }
];

