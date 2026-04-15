import { buildHeaders, getServerApiBase, requestJson } from '@/lib/http-client'

export interface OrderItem {
    id: string
    orderId: string
    foodId: string
    foodName: string
    quantity: number
    price: number
    imageUrl?: string | null
    specialInstructions?: string
}

export interface Order {
    id: string
    customerId: string
    recipientName?: string | null
    recipientPhone?: string | null
    restaurantId: string
    restaurantName: string
    restaurantAvatarUrl?: string | null
    items: OrderItem[]
    totalAmount: number
    status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled' | 'refunded'
    cancelReason?: string | null
    refundPending?: boolean
    deliveryAddress: string
    deliveryInstructions?: string
    paymentMethod: string
    paymentStatus?: string | null
    createdAt: string
    updatedAt: string
    estimatedDeliveryTime?: string
    expiresAt?: string | null
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

function normalizeOrderStatus(input: unknown): Order['status'] {
    const raw = String(input ?? '').trim()
    const s = raw.toLowerCase()

    // Accept a few common variants coming from older/back-end naming.
    if (s === 'outfordelivery' || s === 'out_for_delivery' || s === 'out-for-delivery') return 'out_for_delivery'
    if (s === 'inprogress') return 'preparing'

    // Canonical statuses already used in the app.
    if (s === 'pending') return 'pending'
    if (s === 'confirmed') return 'confirmed'
    if (s === 'preparing') return 'preparing'
    if (s === 'delivered') return 'delivered'
    if (s === 'completed') return 'completed'
    if (s === 'cancelled' || s === 'canceled') return 'cancelled'
    if (s === 'refunded') return 'refunded'

    return 'pending'
}

function normalizeOrder(raw: any): Order {
    return {
        ...raw,
        status: normalizeOrderStatus(raw?.status),
        paymentStatus: raw?.paymentStatus ? String(raw.paymentStatus).toLowerCase() : raw?.paymentStatus ?? null,
        paymentMethod: raw?.paymentMethod ? String(raw.paymentMethod).toLowerCase() : raw?.paymentMethod,
    } as Order
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
        const base = getServerApiBase()
        const url = `${base}/orders${queryString ? `?${queryString}` : ''}`

        const res = await requestJson<OrderListResponse>(url, {
            headers: buildHeaders(),
        })
        return {
            ...res,
            orders: Array.isArray(res?.orders) ? res.orders.map(normalizeOrder) : [],
        }
    }

    /**
     * Get a specific order by ID
     */
    static async getOrderById(orderId: string): Promise<Order> {
        const base = getServerApiBase()
        const res = await requestJson<Order>(`${base}/orders/${orderId}`, {
            headers: buildHeaders(),
        })
        return normalizeOrder(res)
    }

    /**
     * Cancel an order
     */
    static async cancelOrder(orderId: string): Promise<{ success: boolean; message?: string }> {
        // Single unified cancellation via DELETE endpoint
        const base = getServerApiBase()
        return requestJson<{ success: boolean; message?: string }>(`${base}/orders/${orderId}`, {
            method: 'DELETE',
            headers: buildHeaders(),
        })
    }

    /**
     * Reorder items from a previous order
     */
    static async reorderItems(orderId: string): Promise<{ success: boolean; message: string }> {
        const base = getServerApiBase()
        return requestJson<{ success: boolean; message: string }>(`${base}/orders/${orderId}/reorder`, {
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
        const base = getServerApiBase()
        return requestJson<{
            status: string
            estimatedDeliveryTime?: string
            trackingInfo?: {
                currentLocation?: string
                driverName?: string
                driverPhone?: string
            }
        }>(`${base}/orders/track/${orderId}`, {
            headers: buildHeaders(),
        })
    }
}
