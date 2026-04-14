import { CartItem } from '@/types/models'
import { buildHeaders, getServerApiBase } from '@/lib/http-client'

export interface CheckoutData {
    cartItems: CartItem[]
    deliveryInfo: {
        phone: string
        address: string
        lat?: number
        lng?: number
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
    orderId?: string
    paymentId?: string
    error?: string
}

export class CheckoutService {
    /**
     * Create Stripe checkout session
     */
    static async createCheckoutSession(data: CheckoutData): Promise<CheckoutSessionResponse> {
        try {
            const base = getServerApiBase()
            // success_url / cancel_url are built on the server from APP_URL
            const response = await fetch(`${base}/payments/create-checkout-session`, {
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
     * Create VNPay payment URL (returns a redirect URL)
     */
    static async createVnPayPaymentUrl(data: CheckoutData): Promise<CheckoutSessionResponse> {
        try {
            const base = getServerApiBase()
            const response = await fetch(`${base}/payments/vnpay/create-payment-url`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                return { error: result.error || 'Failed to create VNPay payment URL' }
            }

            return { url: result.url, orderId: result.orderId, paymentId: result.paymentId }
        } catch (error) {
            console.error('Error creating VNPay payment URL:', error)
            return { error: 'Network error occurred' }
        }
    }

    /**
     * Create order directly (for non-Stripe payments)
     */
    static async createOrder(data: Omit<CheckoutData, 'total'>): Promise<OrderResponse> {
        try {
            const base = getServerApiBase()
            const response = await fetch(`${base}/orders`, {
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
            const base = getServerApiBase()
            const response = await fetch(`${base}/payments/process-checkout-success`, {
                method: 'POST',
                headers: buildHeaders(),
                body: JSON.stringify({ sessionId }),
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
     * Verify VNPAY return URL query (HMAC) on the server — same rules as IPN.
     */
    static async verifyVnPayReturnQuery(searchParams: URLSearchParams): Promise<{
        valid: boolean
        txnRef?: string
        responseCode?: string
        transactionStatus?: string
        error?: string
    }> {
        try {
            const base = getServerApiBase()
            const qs = searchParams.toString()
            const response = await fetch(`${base}/payments/vnpay/verify-return?${qs}`, {
                method: 'GET',
                cache: 'no-store',
            })
            const result = await response.json().catch(() => ({}))
            if (!response.ok) {
                return { valid: false, error: (result as { message?: string }).message || 'Verify failed' }
            }
            return result as {
                valid: boolean
                txnRef?: string
                responseCode?: string
                transactionStatus?: string
            }
        } catch (error) {
            console.error('verifyVnPayReturnQuery', error)
            return { valid: false, error: 'Network error' }
        }
    }

    static async getStripeSessionStatus(sessionId: string): Promise<{
        success: boolean
        orderId?: string
        orderStatus?: string
        paymentId?: string
        paymentStatus?: string
        stripePaymentStatus?: string
        error?: string
    }> {
        try {
            const base = getServerApiBase()
            const response = await fetch(
                `${base}/payments/stripe/session-status?sessionId=${encodeURIComponent(sessionId)}`,
                {
                    method: 'GET',
                    headers: buildHeaders(),
                }
            )
            const result = await response.json()

            if (!response.ok) {
                return { success: false, error: result.error || 'Failed to fetch session status' }
            }

            return {
                success: true,
                orderId: result.orderId,
                orderStatus: result.orderStatus,
                paymentId: result.paymentId,
                paymentStatus: result.paymentStatus,
                stripePaymentStatus: result.stripePaymentStatus,
            }
        } catch (error) {
            console.error('Error fetching stripe session status:', error)
            return { success: false, error: 'Network error occurred' }
        }
    }

    /**
     * Verify cart state after payment
     */
    static async verifyCartState(): Promise<{ items: any[]; isEmpty: boolean }> {
        try {
            const base = getServerApiBase()
            const response = await fetch(`${base}/cart`, {
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
