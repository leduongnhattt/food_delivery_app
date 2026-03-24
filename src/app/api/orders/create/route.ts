import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'
import { PrismaClient } from '@/generated/prisma'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { ITEM_ORDER_VALUE_LIMIT } from '@/lib/order-limit'

const prisma = new PrismaClient()

export const POST = withRateLimit(async (request: NextRequest) => {
    try {
        const { cartItems, deliveryInfo, voucherCode, paymentIntentId } = await request.json()

        // Get authenticated user from request (optional for guest orders)
        const auth = getAuthenticatedUser(request)
        let customer = null

        if (auth.success && auth.user?.id) {
            // Get customer info from authenticated user
            customer = await prisma.customer.findFirst({
                where: {
                    AccountID: auth.user.id
                },
                include: { account: true }
            })
        }

        // If no authenticated customer, return error
        if (!customer) {
            return NextResponse.json(
                { error: 'Customer profile not found. Please login to place an order.' },
                { status: 404 }
            )
        }

        // Validate availability before creating order
        await Promise.all(
            cartItems.map(async (item: any) => {
                const food = await prisma.food.findUnique({
                    where: { FoodID: item.menuItem.id },
                    select: { DishName: true, IsAvailable: true, Price: true }
                })
                if (!food) {
                    throw new Error(`Food item not found: ${item.menuItem.id}`)
                }
                if (!food.IsAvailable) {
                    throw new Error(`Item ${food.DishName} is currently unavailable`)
                }
                const unitPrice = Number(item.menuItem?.price ?? food?.Price ?? 0)
                if (unitPrice * item.quantity > ITEM_ORDER_VALUE_LIMIT) {
                    throw new Error(`Item ${food?.DishName ?? item.menuItem.id} exceeds the order limit. Please place a separate order for additional quantity.`)
                }
            })
        )

        // Calculate totals
        const subtotal = cartItems.reduce((sum: number, item: any) =>
            sum + (item.menuItem.price * item.quantity), 0
        )
        const deliveryFee = 0.5 // Fixed delivery fee
        const voucherDiscount = 0 // TODO: Calculate voucher discount
        const total = subtotal + deliveryFee - voucherDiscount

        // Get voucher if provided
        let voucherId = null
        if (voucherCode) {
            const voucher = await prisma.voucher.findFirst({
                where: {
                    Code: voucherCode,
                    Status: 'Approved',
                    ExpiryDate: { gt: new Date() }
                }
            })
            if (voucher) voucherId = voucher.VoucherID
        }

        // Create order
        const order = await prisma.order.create({
            data: {
                CustomerID: customer.CustomerID,
                VoucherID: voucherId,
                TotalAmount: total,
                DeliveryAddress: deliveryInfo.address,
                DeliveryNote: '', // Optional delivery note
                Status: 'Pending'
            }
        })

        // Create order details (no stock update)
        const orderDetails = await Promise.all(
            cartItems.map(async (item: any) => {
                // Create order detail
                const orderDetail = await prisma.orderDetail.create({
                    data: {
                        OrderID: order.OrderID,
                        FoodID: item.menuItem.id,
                        SubTotal: item.menuItem.price * item.quantity,
                        Quantity: item.quantity
                    }
                })
                return orderDetail
            })
        )

        // Create Payment record for all orders
        if (paymentIntentId) {
            // Stripe payment
            await prisma.payment.create({
                data: {
                    PaymentID: paymentIntentId,
                    OrderID: order.OrderID,
                    PaymentMethod: 'CreditCard',
                    TransactionID: paymentIntentId,
                    PaymentStatus: 'Completed',
                    TransactionData: {
                        payment_intent_id: paymentIntentId,
                        status: 'succeeded',
                        amount: Number(order.TotalAmount) * 100, // Convert to cents
                        currency: 'usd'
                    }
                }
            })
        } else {
            // Cash on Delivery payment
            const cashPaymentId = 'cash-' + Date.now()
            await prisma.payment.create({
                data: {
                    PaymentID: cashPaymentId,
                    OrderID: order.OrderID,
                    PaymentMethod: 'Cash',
                    TransactionID: cashPaymentId,
                    PaymentStatus: 'Pending', // COD is pending until delivery
                    TransactionData: {
                        payment_type: 'cash_on_delivery',
                        amount: Number(order.TotalAmount),
                        currency: 'vnd',
                        status: 'pending_delivery'
                    }
                }
            })
        }

        // Create Settlement and SettlementItem for enterprise
        // Get enterprise from first cart item
        const firstCartItem = cartItems[0]
        if (firstCartItem?.menuItem?.restaurantId) {
            const enterprise = await prisma.enterprise.findFirst({
                where: { EnterpriseID: firstCartItem.menuItem.restaurantId }
            })

            if (enterprise) {
                // Create or get current settlement period
                const now = new Date()
                const periodStart = new Date(now.getFullYear(), now.getMonth(), 1) // First day of month
                const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0) // Last day of month

                let settlement = await prisma.settlement.findFirst({
                    where: {
                        EnterpriseID: enterprise.EnterpriseID,
                        PeriodStart: periodStart,
                        PeriodEnd: periodEnd,
                        Status: 'Pending'
                    }
                })

                if (!settlement) {
                    settlement = await prisma.settlement.create({
                        data: {
                            SettlementID: 'settlement-' + Date.now(),
                            EnterpriseID: enterprise.EnterpriseID,
                            PeriodStart: periodStart,
                            PeriodEnd: periodEnd,
                            NetPayout: 0, // Will be calculated later
                            Status: 'Pending'
                        }
                    })
                }

                // Create SettlementItem
                await prisma.settlementItem.create({
                    data: {
                        SettlementItemID: 'settlement-item-' + Date.now(),
                        SettlementID: settlement.SettlementID,
                        OrderID: order.OrderID,
                        IsCOD: !paymentIntentId // true for cash, false for card
                    }
                })

                console.log('Created settlement records for enterprise:', enterprise.EnterpriseID)
            }
        }

        // Clear cart after successful order creation
        // TODO: Clear cart items

        return NextResponse.json({
            orderId: order.OrderID,
            total: total,
            order: {
                id: order.OrderID,
                status: order.Status,
                total: order.TotalAmount,
                items: orderDetails
            }
        })

    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        )
    }
}, (req) => ({ key: `orders_create:${getClientIp(req)}`, limit: 20, windowMs: 60 * 1000 }))
