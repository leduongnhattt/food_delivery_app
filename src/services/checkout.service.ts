import { CartItem } from '@/types/models'
import { buildHeaders } from '@/lib/http-client'

export interface CheckoutData {
    cartItems: CartItem[]
    deliveryInfo: {
        phone: string
        address: string
    }
    voucherCode?: string
    total: number
}

export interface OrderResponse {
    orderId?: string
    error?: string
}

export interface CheckoutSessionResponse {
    url?: string
    error?: string
}

export class CheckoutService {
    /**
     * Create Stripe checkout session
     */
    static async createCheckoutSession(data: CheckoutData): Promise<CheckoutSessionResponse> {
        try {
            const response = await fetch('/api/payments/create-checkout-session', {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                return { error: result.error || 'Failed to create checkout session' }
            }

            return { url: result.url }
        } catch (error) {
            console.error('Error creating checkout session:', error)
            return { error: 'Network error occurred' }
        }
    }

    /**
     * Create order directly (for non-Stripe payments)
     */
    static async createOrder(data: Omit<CheckoutData, 'total'>): Promise<OrderResponse> {
        try {
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                return { error: result.error || 'Failed to create order' }
            }

            return { orderId: result.orderId }
        } catch (error) {
            console.error('Error creating order:', error)
            return { error: 'Network error occurred' }
        }
    }

    /**
     * Process successful payment
     */
    static async processPaymentSuccess(sessionId: string): Promise<{ success: boolean; orderId?: string; error?: string }> {
        try {
            const response = await fetch('/api/payments/process-checkout-success', {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify({ sessionId })
            })

            const result = await response.json()

            if (!response.ok) {
                return { success: false, error: result.error || 'Payment processing failed' }
            }

            return { success: true, orderId: result.orderId }
        } catch (error) {
            console.error('Error processing payment success:', error)
            return { success: false, error: 'Network error occurred' }
        }
    }

    /**
     * Verify cart state after payment
     */
    static async verifyCartState(): Promise<{ items: any[]; isEmpty: boolean }> {
        try {
            const response = await fetch('/api/cart', {
                method: 'GET',
                headers: buildHeaders(),
                cache: 'no-store'
            })

            const result = await response.json()
            return {
                items: result.items || [],
                isEmpty: !result.items || result.items.length === 0
            }
        } catch (error) {
            console.error('Error verifying cart state:', error)
            return { items: [], isEmpty: true }
        }
    }
}
