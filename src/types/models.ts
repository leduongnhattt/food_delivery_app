export interface User {
    id: string
    email: string
    name: string
    phone?: string
    address?: string
    createdAt: Date
    updatedAt: Date
}

export interface Restaurant {
    id: string
    name: string
    description: string
    address: string
    phone: string
    avatarUrl: string
    rating: number
    deliveryTime: string
    minimumOrder: number
    isOpen: boolean
    openHours?: string
    closeHours?: string
    createdAt: Date
    updatedAt: Date
}

export interface MenuItem {
    id: string
    name: string
    description: string
    price: number
    image: string
    category: string
    isAvailable: boolean
    restaurantId: string
    restaurantName?: string
    createdAt: Date
    updatedAt: Date
}

export interface Order {
    id: string
    userId: string
    restaurantId: string
    items: OrderItem[]
    totalAmount: number
    status: OrderStatus
    deliveryAddress: string
    deliveryInstructions?: string
    createdAt: Date
    updatedAt: Date
}

export interface OrderItem {
    id: string
    orderId: string
    menuItemId: string
    quantity: number
    price: number
    specialInstructions?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'

export interface CartItem {
    menuItem: MenuItem
    quantity: number
    specialInstructions?: string
}

// RestaurantCard specific interface
export interface RestaurantCardData {
    enterpriseId: string;
    accountId: string;
    enterpriseName: string;
    address: string;
    description: string;
    avatarUrl?: string;
    status: "open" | "closed";
}

// Food interfaces
export interface Menu {
    menuId: string;
    category: string;
}

export interface Food {
    foodId: string;
    dishName: string;
    price: number;
    stock: number;
    isAvailable?: boolean;
    description: string;
    imageUrl: string;
    restaurantId: string;
    menu: Menu;
}

// Types used by FoodsSlideMenu → OrderModal mapping
export interface RestaurantModalInfo {
    id: string
    name: string
    rating: number
    deliveryTime: string
    logo: string | null
}

export interface ApiRestaurantPayload {
    restaurant?: {
        id?: string
        name?: string
        avatarUrl?: string
        rating?: number
        deliveryTime?: string
    }
    enterprise?: {
        EnterpriseID?: string
        EnterpriseName?: string
        Avatar?: string
    }
}

// Component prop types
export interface FoodsSlideMenuProps {
    title?: string
    foods?: Food[]
    onOrderFood: (foodId: string) => void
    className?: string
    // New props for database integration
    useDatabase?: boolean
    restaurantId?: string
    category?: string
    limit?: number
}
export interface CartItemPayload {
    foodId: string
    quantity: number
    note?: string
}

export interface CartSnapshotItem {
    foodId: string
    quantity: number
    priceSnapshot?: number
    note?: string
}

export interface CartSnapshot {
    cartId: string | null
    items: CartSnapshotItem[]
}
export interface Category {
    CategoryID: string
    CategoryName: string
}