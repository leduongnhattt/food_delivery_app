import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyTokenEdgeSync } from '@/lib/auth-edge'

export async function GET(req: NextRequest) {
  try {

    // Get authentication token from Authorization header or cookies
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('refresh_token')?.value



    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = verifyTokenEdgeSync(token)


    if (!decoded?.accountId || decoded.role?.toLowerCase() !== 'customer') {
      return NextResponse.json({ error: 'Customer access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const customer = await prisma.customer.findUnique({
      where: { AccountID: decoded.accountId },
      select: { CustomerID: true }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      CustomerID: customer.CustomerID
    }

    if (status) {
      where.Status = status.toUpperCase()
    }

    if (startDate || endDate) {
      where.OrderDate = {}
      if (startDate) where.OrderDate.gte = new Date(startDate)
      if (endDate) where.OrderDate.lte = new Date(endDate)
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderDetails: {
            include: {
              food: {
                select: {
                  FoodID: true,
                  DishName: true,
                  Price: true,
                  EnterpriseID: true,
                  enterprise: {
                    select: {
                      EnterpriseName: true
                    }
                  }
                }
              }
            }
          },
          customer: {
            select: {
              FullName: true
            }
          }
        },
        orderBy: {
          OrderDate: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where })
    ])


    // Transform orders to match our interface
    const transformedOrders = orders.map(order => {
      // Get restaurant info from first order detail
      const firstDetail = order.orderDetails[0]
      const restaurantName = firstDetail?.food?.enterprise?.EnterpriseName || 'Unknown Restaurant'
      const restaurantId = firstDetail?.food?.EnterpriseID || ''

      return {
        id: order.OrderID,
        customerId: order.CustomerID,
        restaurantId: restaurantId,
        restaurantName: restaurantName,
        items: order.orderDetails.map(detail => ({
          id: detail.OrderDetailID,
          orderId: detail.OrderID,
          foodId: detail.FoodID,
          foodName: detail.food.DishName,
          quantity: detail.Quantity,
          price: Number(detail.SubTotal),
          specialInstructions: undefined // Add if you have this field
        })),
        totalAmount: Number(order.TotalAmount),
        status: order.Status.toLowerCase(),
        deliveryAddress: order.DeliveryAddress,
        deliveryInstructions: order.DeliveryNote,
        paymentMethod: 'card', // You might want to get this from Payment table
        createdAt: order.OrderDate.toISOString(),
        updatedAt: order.OrderDate.toISOString(),
        estimatedDeliveryTime: order.EstimatedDeliveryTime?.toISOString()
      }
    })


    return NextResponse.json({
      orders: transformedOrders,
      total,
      page,
      limit
    })
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}