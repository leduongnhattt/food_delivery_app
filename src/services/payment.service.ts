import { CheckoutService } from './checkout.service'
import { enableCartSilentMode, disableCartSilentMode } from './cart.service'

export interface PaymentResult {
    success: boolean
    orderId?: string
    error?: string
    redirectUrl?: string
}

export interface PaymentNotification {
    notifyOtherTabs: () => void
    clearLocalStorage: () => void
}

export class PaymentService {
    /**
     * Handle Cash on Delivery payment flow
     */
    static async processCashOnDelivery(
        checkoutData: Parameters<typeof CheckoutService.createOrder>[0],
        onCartClear: () => void,
        onNotification: PaymentNotification
    ): Promise<PaymentResult> {
        try {
            // Enable silent mode to prevent cart UI updates during payment
            enableCartSilentMode()

            // Create order for cash payment
            const result = await CheckoutService.createOrder(checkoutData)

            if (result.error) {
                disableCartSilentMode() // Re-enable normal cart behavior on error
                return { success: false, error: result.error }
            }

            if (result.orderId) {
                // Clear cart and notify other tabs
                onCartClear()
                onNotification.notifyOtherTabs()

                // Keep silent mode enabled briefly to prevent UI flicker
                setTimeout(() => {
                    disableCartSilentMode()
                }, 1000)

                return { success: true, orderId: result.orderId }
            }

            disableCartSilentMode() // Re-enable normal cart behavior on error
            return { success: false, error: 'Failed to create order' }
        } catch (error: any) {
            disableCartSilentMode() // Re-enable normal cart behavior on error
            return { success: false, error: error?.message || 'Failed to process cash payment' }
        }
    }

    /**
     * Handle Stripe payment flow
     */
    static async processStripePayment(
        checkoutData: Parameters<typeof CheckoutService.createCheckoutSession>[0]
    ): Promise<PaymentResult> {
        const sessionResult = await CheckoutService.createCheckoutSession(checkoutData)

        if (sessionResult.error) {
            return { success: false, error: sessionResult.error }
        }

        if (sessionResult.url) {
            return { success: true, redirectUrl: sessionResult.url }
        }

        return { success: false, error: 'No checkout URL received' }
    }


    /**
     * Handle successful payment processing
     */
    static async handlePaymentSuccess(
        sessionId: string,
        onCartClear: () => void,
        onNotification: PaymentNotification
    ): Promise<PaymentResult> {
        try {
            // Enable silent mode to prevent cart UI updates during payment processing
            enableCartSilentMode()

            const result = await CheckoutService.processPaymentSuccess(sessionId)

            if (result.success) {
                // Clear cart immediately without verification to avoid duplicate API calls
                onCartClear()

                // Notify other tabs
                onNotification.notifyOtherTabs()

                // Keep silent mode enabled briefly to prevent UI flicker
                setTimeout(() => {
                    disableCartSilentMode()
                }, 1000)

                return { success: true, orderId: result.orderId }
            }

            disableCartSilentMode() // Re-enable normal cart behavior on error
            return { success: false, error: result.error }
        } catch (error: any) {
            disableCartSilentMode() // Re-enable normal cart behavior on error
            return { success: false, error: error?.message || 'Payment processing failed' }
        }
    }

    /**
     * Create payment notification utilities
     */
    static createPaymentNotification(): PaymentNotification {
        return {
            notifyOtherTabs: () => {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('cart_cleared', Date.now().toString())

                    // Trigger storage event for other tabs
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: 'cart_cleared',
                        newValue: Date.now().toString(),
                        url: window.location.href
                    }))
                }
            },

            clearLocalStorage: () => {
                if (typeof window !== 'undefined') {
                    setTimeout(() => {
                        localStorage.removeItem('cart_cleared')
                    }, 100)
                }
            }
        }
    }
}