import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
    getCachedOrders,
    refreshOrdersCache,
    CachedOrder
} from "@/lib/orders-cache";

export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthenticatedUser(request);
        if (!user.success || user.user?.role !== "Enterprise") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const accountId = user.user!.id;

        // Get enterprise ID from account
        const enterprise = await prisma.enterprise.findUnique({
            where: { AccountID: accountId },
            select: { EnterpriseID: true, EnterpriseName: true }
        });

        if (!enterprise) {
            return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
        }

        const enterpriseId = enterprise.EnterpriseID;

        // Check Redis cache first
        const cachedOrders = await getCachedOrders(enterpriseId);
        if (cachedOrders) {
            return NextResponse.json({
                success: true,
                orders: cachedOrders.orders,
                totalCount: cachedOrders.totalCount,
                lastUpdated: cachedOrders.lastUpdated,
                fromCache: true
            });
        }

        // Get all orders for this enterprise from database
        const orders = await prisma.order.findMany({
            where: {
                orderDetails: {
                    some: {
                        food: {
                            EnterpriseID: enterpriseId
                        }
                    }
                }
            },
            include: {
                customer: {
                    select: {
                        FullName: true,
                        PhoneNumber: true,
                        Address: true,
                        account: {
                            select: {
                                Username: true
                            }
                        }
                    }
                },
                orderDetails: {
                    select: {
                        Quantity: true,
                        SubTotal: true,
                        food: {
                            select: {
                                DishName: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                OrderDate: 'desc'
            }
        });

        // Format the response
        const formattedOrders: CachedOrder[] = orders.map(order => ({
            id: order.OrderID,
            customerName: order.customer?.FullName || order.customer?.account?.Username || 'Unknown Customer',
            customerUsername: order.customer?.account?.Username || null,
            totalAmount: Number(order.TotalAmount),
            status: order.Status,
            createdAt: order.OrderDate.toISOString(),
            items: order.orderDetails.reduce((sum: number, detail: any) => sum + detail.Quantity, 0),
            deliveryAddress: order.DeliveryAddress,
            phoneNumber: order.customer?.PhoneNumber || null,
            customerAddress: order.customer?.Address || null,
            orderDetails: order.orderDetails.map(detail => ({
                dishName: detail.food.DishName,
                quantity: detail.Quantity,
                subTotal: Number(detail.SubTotal)
            }))
        }));

        // Cache the orders data in Redis
        await refreshOrdersCache(enterpriseId, formattedOrders);

        return NextResponse.json({
            success: true,
            orders: formattedOrders,
            totalCount: formattedOrders.length,
            lastUpdated: new Date().toISOString(),
            fromCache: false
        });

    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
