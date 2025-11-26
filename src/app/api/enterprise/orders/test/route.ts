import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthenticatedUser(request);
        if (!user.success || user.user?.role !== "Enterprise") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const enterpriseId = user.user!.id;

        // Test query to get orders with all related data
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
                                Username: true,
                                Email: true
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
                                DishName: true,
                                Price: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                OrderDate: 'desc'
            },
            take: 5
        });

        // Return raw data for testing
        return NextResponse.json({
            enterpriseId,
            totalOrders: orders.length,
            orders: orders.map(order => ({
                orderId: order.OrderID,
                orderDate: order.OrderDate,
                totalAmount: Number(order.TotalAmount),
                status: order.Status,
                deliveryAddress: order.DeliveryAddress,
                customer: {
                    fullName: order.customer?.FullName,
                    phoneNumber: order.customer?.PhoneNumber,
                    address: order.customer?.Address,
                    username: order.customer?.account?.Username,
                    email: order.customer?.account?.Email
                },
                orderDetails: order.orderDetails.map(detail => ({
                    dishName: detail.food.DishName,
                    quantity: detail.Quantity,
                    price: Number(detail.food.Price),
                    subTotal: Number(detail.SubTotal)
                }))
            }))
        });

    } catch (error) {
        console.error("Error fetching test orders:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
