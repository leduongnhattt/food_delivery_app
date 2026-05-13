import { buildHeaders, getServerApiBase, requestJson } from '@/lib/http'

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
    pricing?: {
        subtotal: number
        deliveryFee: number
        voucherDiscount: number
    } | null
    voucherCode?: string | null
    totalAmount: number
    status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled' | 'refunded'
    cancelReason?: string | null
    refundPending?: boolean
    deliveredAt?: string | null
    returnRequestStatus?: ReturnRequestStatus | null
    statusHistory?: Array<{ status: string; at: string; actor?: string }> | null
    cancelledAt?: string | null
    deliveryAddress: string
    deliveryInstructions?: string
    paymentMethod: string
    paymentStatus?: string | null
    createdAt: string
    updatedAt: string
    estimatedDeliveryTime?: string
    expiresAt?: string | null
}

export type ReturnRequestStatus =
    | 'PendingReview'
    | 'Approved'
    | 'Rejected'
    | 'CancelledByCustomer'
    | 'Completed'

export type ReturnReasonCode =
    | 'missing_items'
    | 'wrong_item'
    | 'quality_issue'
    | 'damaged_spill'
    | 'late_delivery'
    | 'other'

export type ReturnRequestedSolution = 'RefundOnly' | 'Replace' | 'StoreCredit'

export interface ReturnRequestItem {
    id: string
    orderDetailId: string
    foodId: string
    foodName: string
    imageUrl: string | null
    quantity: number
    lineAmount: number
}

export interface ReturnRequestSummary {
    id: string
    orderId: string
    status: ReturnRequestStatus
    reasonCode: ReturnReasonCode
    reasonText: string | null
    requestedSolution: ReturnRequestedSolution
    requestedAmount: number
    requestedAt: string
    updatedAt: string
    enterpriseResponseNote?: string | null
    items: ReturnRequestItem[]
}

export interface CreateReturnRequestBody {
    items: Array<{ orderDetailId: string; quantity: number }>
    reasonCode: ReturnReasonCode
    reasonText?: string | null
    requestedSolution?: ReturnRequestedSolution
    metadata?: unknown
    evidenceImages?: Array<{ file: File }>
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
    const pricingRaw = raw?.pricing
    const pricing =
        pricingRaw &&
        typeof pricingRaw === 'object' &&
        !Array.isArray(pricingRaw)
            ? {
                  subtotal: Number(pricingRaw.subtotal) || 0,
                  deliveryFee: Number(pricingRaw.deliveryFee) || 0,
                  voucherDiscount: Number(pricingRaw.voucherDiscount) || 0,
              }
            : null

    return {
        ...raw,
        status: normalizeOrderStatus(raw?.status),
        paymentStatus: raw?.paymentStatus ? String(raw.paymentStatus).toLowerCase() : raw?.paymentStatus ?? null,
        paymentMethod: raw?.paymentMethod ? String(raw.paymentMethod).toLowerCase() : raw?.paymentMethod,
        pricing,
        voucherCode:
            typeof raw?.voucherCode === 'string' && raw.voucherCode.trim()
                ? raw.voucherCode.trim()
                : raw?.voucherCode ?? null,
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

    static async createReturnRequest(orderId: string, body: CreateReturnRequestBody): Promise<{
        success: boolean
        returnRequest: {
            id: string
            orderId: string
            status: ReturnRequestStatus
            requestedAmount: number
            requestedAt: string
        }
    }> {
        const base = getServerApiBase()
        const evidence = Array.isArray((body as any)?.evidenceImages) ? (body as any).evidenceImages as Array<{ file: File }> : []
        if (evidence.length > 0) {
            const form = new FormData()
            form.append('items', JSON.stringify(body.items))
            form.append('reasonCode', body.reasonCode)
            form.append('reasonText', body.reasonText ?? '')
            form.append('requestedSolution', body.requestedSolution ?? '')
            if (body.metadata !== undefined) {
                form.append('metadata', JSON.stringify(body.metadata))
            }
            for (const x of evidence.slice(0, 3)) {
                if (x?.file) form.append('evidenceImages', x.file)
            }

            const headers = buildHeaders() as Record<string, string>
            delete headers['Content-Type']

            const res = await fetch(`${base}/orders/${encodeURIComponent(orderId)}/returns`, {
                method: 'POST',
                headers,
                body: form,
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({} as any))
                const e: any = new Error(err?.message || err?.error || 'Failed to submit return request')
                ;(e as any).status = res.status
                throw e
            }
            return (await res.json()) as any
        }

        const jsonBody = { ...body } as any
        delete jsonBody.evidenceImages
        return requestJson(`${base}/orders/${encodeURIComponent(orderId)}/returns`, {
            method: 'POST',
            headers: buildHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(jsonBody),
        })
    }

    static async getReturnRequest(orderId: string): Promise<{ success: boolean; returnRequest: ReturnRequestSummary | null }> {
        const base = getServerApiBase()
        return requestJson(`${base}/orders/${encodeURIComponent(orderId)}/returns`, {
            method: 'GET',
            headers: buildHeaders(),
        })
    }
}
