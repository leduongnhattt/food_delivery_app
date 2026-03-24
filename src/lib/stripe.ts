import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
    console.warn('[stripe] STRIPE_SECRET_KEY is not set; Stripe features will be disabled')
}

export const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, {
        apiVersion: '2025-08-27.basil',
        typescript: true,
    })
    : null

// Get publishable key for frontend
export const getStripePublishableKey = () => {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
        console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables')
        return 'pk_test_missing_key'
    }
    return key
}

// Stripe configuration
export const STRIPE_CONFIG = {
    currency: 'usd', // US Dollar
    paymentMethods: ['card'], // Support card payments
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
}
