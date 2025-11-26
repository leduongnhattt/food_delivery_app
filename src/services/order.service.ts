import { buildHeaders, requestJson } from '@/lib/http-client'

export interface OrderItem {
    id: string
    orderId: string
    foodId: string
    foodName: string
    quantity: number
    price: number
    specialInstructions?: string
}

export interface Order {
    id: string
    customerId: string
    restaurantId: string
    restaurantName: string
    items: OrderItem[]
    totalAmount: number
    status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'
    deliveryAddress: string
    deliveryInstructions?: string
    paymentMethod: string
    createdAt: string
    updatedAt: string
    estimatedDeliveryTime?: string
}

export interface OrderListResponse {
    orders: Order[]
    total: number
    page: number
    limit: number
}

export interface OrderFilters {
    status?: string
    page?: number
    limit?: number
    startDate?: string
    endDate?: string
}

export class OrderService {
    /**
     * Get orders for the current user
     */
    static async getUserOrders(filters?: OrderFilters): Promise<OrderListResponse> {
        const queryParams = new URLSearchParams()

        if (filters?.status) queryParams.append('status', filters.status)
        if (filters?.page) queryParams.append('page', filters.page.toString())
        if (filters?.limit) queryParams.append('limit', filters.limit.toString())
        if (filters?.startDate) queryParams.append('startDate', filters.startDate)
        if (filters?.endDate) queryParams.append('endDate', filters.endDate)

        const queryString = queryParams.toString()
        const url = `/api/orders${queryString ? `?${queryString}` : ''}`

        return requestJson<OrderListResponse>(url, {
            headers: buildHeaders(),
        })
    }

    /**
     * Get a specific order by ID
     */
    static async getOrderById(orderId: string): Promise<Order> {
        return requestJson<Order>(`/api/orders/${orderId}`, {
            headers: buildHeaders(),
        })
    }

    /**
     * Cancel an order
     */
    static async cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
        // Single unified cancellation via DELETE endpoint
        return requestJson<{ success: boolean; message?: string }>(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: buildHeaders(),
        })
    }

    /**
     * Reorder items from a previous order
     */
    static async reorderItems(orderId: string): Promise<{ success: boolean; message: string }> {
        return requestJson<{ success: boolean; message: string }>(`/api/orders/${orderId}/reorder`, {
            method: 'POST',
            headers: buildHeaders({ 'Content-Type': 'application/json' }),
        })
    }

    /**
     * Track order status
     */
    static async trackOrder(orderId: string): Promise<{
        status: string
        estimatedDeliveryTime?: string
        trackingInfo?: {
            currentLocation?: string
            driverName?: string
            driverPhone?: string
        }
    }> {
        return requestJson<{
            status: string
            estimatedDeliveryTime?: string
            trackingInfo?: {
                currentLocation?: string
                driverName?: string
                driverPhone?: string
            }
        }>(`/api/orders/${orderId}/track`, {
            headers: buildHeaders(),
        })
    }
}
