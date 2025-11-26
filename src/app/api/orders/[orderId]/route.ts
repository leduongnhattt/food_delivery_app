import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireCustomer } from '@/lib/auth-helpers'
import { withRateLimit, getClientIp } from '@/lib/rate-limit'

export const GET = withRateLimit(async (request: NextRequest) => {
    try {
        const auth = requireCustomer(request)
        if (!auth.success) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
        const customerAccountId = auth.user!.id
        const pathname = new URL(request.url).pathname
        const segments = pathname.split('/')
        const orderId = segments[segments.indexOf('orders') + 1]

        if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })

        // Resolve customer id from account id
        const customer = await prisma.customer.findFirst({ where: { AccountID: customerAccountId }, select: { CustomerID: true } })
        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

        const order = await prisma.order.findUnique({
            where: { OrderID: orderId },
            include: {
                orderDetails: {
                    include: {
                        food: {
                            include: {
                                enterprise: { select: { EnterpriseID: true, EnterpriseName: true } }
                            }
                        }
                    }
                },
                payments: { orderBy: { PaymentDate: 'desc' }, take: 1 }
            }
        })

        if (!order || order.CustomerID !== customer.CustomerID) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        const firstDetail = order.orderDetails[0]
        const restaurantId = firstDetail?.food.enterprise.EnterpriseID || ''
        const restaurantName = firstDetail?.food.enterprise.EnterpriseName || ''
        const items = order.orderDetails.map(od => ({
            id: od.OrderDetailID,
            orderId: od.OrderID,
            foodId: od.FoodID,
            foodName: od.food.DishName,
            quantity: od.Quantity,
            price: Number(od.food.Price),
            specialInstructions: od.food.Description || undefined,
        }))

        const response = {
            id: order.OrderID,
            customerId: order.CustomerID,
            restaurantId,
            restaurantName,
            items,
            totalAmount: Number(order.TotalAmount),
            status: (order.Status as any).toString().toLowerCase(),
            deliveryAddress: order.DeliveryAddress,
            deliveryInstructions: order.DeliveryNote || undefined,
            paymentMethod: order.payments[0]?.PaymentMethod || 'CreditCard',
            createdAt: order.OrderDate.toISOString(),
            updatedAt: new Date().toISOString(),
            estimatedDeliveryTime: order.EstimatedDeliveryTime?.toISOString()
        }

        return NextResponse.json(response)
    } catch (e) {
        console.error('GET /api/orders/[orderId] failed', e)
        return NextResponse.json({ error: 'Failed to get order' }, { status: 500 })
    }
}, (req) => ({ key: `orders_get:${getClientIp(req)}`, limit: 60, windowMs: 60 * 1000 }))

export const DELETE = withRateLimit(async (request: NextRequest) => {
    try {
        const auth = requireCustomer(request)
        if (!auth.success) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 })
        const customerAccountId = auth.user!.id
        const pathname = new URL(request.url).pathname
        const segments = pathname.split('/')
        const orderId = segments[segments.indexOf('orders') + 1]

        if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })

        // Resolve customer id from account id
        const customer = await prisma.customer.findFirst({ where: { AccountID: customerAccountId }, select: { CustomerID: true } })
        if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

        const order = await prisma.order.findUnique({ where: { OrderID: orderId }, select: { CustomerID: true } })
        if (!order || order.CustomerID !== customer.CustomerID) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Delete with transaction similar to enterprise endpoint
        await prisma.$transaction(async (tx) => {
            // Delete settlement items first (Restrict constraint)
            await tx.settlementItem.deleteMany({ where: { OrderID: orderId } })
            // Delete payments (Cascade)
            await tx.payment.deleteMany({ where: { OrderID: orderId } })
            // Delete order details (Cascade)
            await tx.orderDetail.deleteMany({ where: { OrderID: orderId } })
            // Finally delete order
            await tx.order.delete({ where: { OrderID: orderId } })
        })

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('DELETE /api/orders/[orderId] failed', e)
        return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
    }
}, (req) => ({ key: `orders_del:${getClientIp(req)}`, limit: 20, windowMs: 60 * 1000 }))


