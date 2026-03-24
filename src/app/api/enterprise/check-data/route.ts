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

        // Simple checks
        const checks = {
            enterpriseId,
            totalEnterprises: await prisma.enterprise.count(),
            totalOrders: await prisma.order.count(),
            totalFoods: await prisma.food.count(),
            totalCustomers: await prisma.customer.count(),
            totalOrderDetails: await prisma.orderDetail.count()
        };

        // Check if this enterprise has any foods
        const enterpriseFoods = await prisma.food.findMany({
            where: { EnterpriseID: enterpriseId },
            select: { FoodID: true, DishName: true }
        });

        // Check if there are any orders with this enterprise's foods
        const ordersWithThisEnterprise = await prisma.order.findMany({
            where: {
                orderDetails: {
                    some: {
                        food: {
                            EnterpriseID: enterpriseId
                        }
                    }
                }
            },
            select: { OrderID: true, TotalAmount: true, Status: true }
        });

        return NextResponse.json({
            checks,
            enterpriseFoods: enterpriseFoods.length,
            foods: enterpriseFoods,
            ordersWithThisEnterprise: ordersWithThisEnterprise.length,
            orders: ordersWithThisEnterprise
        });

    } catch (error) {
        console.error("Check data error:", error);
        return NextResponse.json(
            {
                error: "Check failed",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
