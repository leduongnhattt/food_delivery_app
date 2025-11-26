import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { PrismaClient } from '@/generated/prisma'
import Stripe from 'stripe'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    if (!stripe || !STRIPE_CONFIG.webhookSecret) {
        console.error('Stripe webhook is not configured. Ensure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set.')
        return NextResponse.json(
            { error: 'Stripe is not configured' },
            { status: 500 }
        )
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            STRIPE_CONFIG.webhookSecret
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        )
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent)
                break

            case 'payment_intent.payment_failed':
                await handlePaymentFailure(event.data.object as Stripe.PaymentIntent)
                break

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
        console.error('No order ID in payment intent metadata')
        return
    }

    // Update payment status
    await prisma.payment.update({
        where: { PaymentID: paymentIntent.id },
        data: {
            PaymentStatus: 'Completed',
            TransactionData: {
                status: 'succeeded',
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                id: paymentIntent.id,
                created: paymentIntent.created,
                description: paymentIntent.description,
                metadata: paymentIntent.metadata
            }
        }
    })

    // Update order status
    await prisma.order.update({
        where: { OrderID: orderId },
        data: {
            Status: 'Confirmed'
        }
    })

    // Calculate and update commission amount
    const order = await prisma.order.findUnique({
        where: { OrderID: orderId },
        include: {
            orderDetails: {
                include: {
                    food: {
                        include: {
                            enterprise: true
                        }
                    }
                }
            }
        }
    })

    if (order && order.orderDetails.length > 0) {
        // Get enterprise commission rate
        const enterprise = order.orderDetails[0].food.enterprise
        const commissionRate = enterprise.CommissionRate || 5.0 // Default 5%
        const commissionAmount = (Number(order.TotalAmount) * Number(commissionRate)) / 100

        // Update order with commission
        await prisma.order.update({
            where: { OrderID: orderId },
            data: {
                CommissionAmount: commissionAmount
            }
        })
    }

    console.log(`Payment succeeded for order ${orderId}`)
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const orderId = paymentIntent.metadata.orderId

    if (!orderId) {
        console.error('No order ID in payment intent metadata')
        return
    }

    // Update payment status
    await prisma.payment.update({
        where: { PaymentID: paymentIntent.id },
        data: {
            PaymentStatus: 'Failed',
            TransactionData: {
                status: 'failed',
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                id: paymentIntent.id,
                created: paymentIntent.created,
                description: paymentIntent.description,
                metadata: paymentIntent.metadata
            }
        }
    })

    // Update order status
    await prisma.order.update({
        where: { OrderID: orderId },
        data: {
            Status: 'Cancelled'
        }
    })

    console.log(`Payment failed for order ${orderId}`)
}
