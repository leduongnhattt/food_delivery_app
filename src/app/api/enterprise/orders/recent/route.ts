import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
    getCachedRecentOrders,
    setCachedRecentOrders,
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
        const cachedRecentOrders = await getCachedRecentOrders(enterpriseId);
        if (cachedRecentOrders) {
            return NextResponse.json({
                success: true,
                orders: cachedRecentOrders,
                fromCache: true
            });
        }

        // Get recent orders with customer information from database
        const recentOrders = await prisma.order.findMany({
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
            },
            take: 10
        });

        // Format the response
        const formattedOrders: CachedOrder[] = recentOrders.map(order => ({
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

        // Cache the recent orders data in Redis
        await setCachedRecentOrders(enterpriseId, formattedOrders);

        return NextResponse.json({
            success: true,
            orders: formattedOrders,
            fromCache: false
        });

    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
