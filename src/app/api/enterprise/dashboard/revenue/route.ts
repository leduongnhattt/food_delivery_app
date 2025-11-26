import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
    getCachedRevenue,
    setCachedRevenue,
    CachedRevenueData
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
        const cachedRevenue = await getCachedRevenue(enterpriseId);
        if (cachedRevenue) {
            return NextResponse.json({
                success: true,
                data: cachedRevenue.data,
                lastUpdated: cachedRevenue.lastUpdated,
                fromCache: true
            });
        }

        // Get revenue data for the last 30 days from database
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const revenueDataFromDB = await prisma.order.groupBy({
            by: ['OrderDate'],
            where: {
                Status: "Completed",
                orderDetails: {
                    some: {
                        food: {
                            EnterpriseID: enterpriseId
                        }
                    }
                },
                OrderDate: {
                    gte: thirtyDaysAgo
                }
            },
            _sum: {
                TotalAmount: true
            },
            orderBy: {
                OrderDate: 'asc'
            }
        });

        // Format the data for charts
        const formattedData = revenueDataFromDB.map(item => ({
            date: item.OrderDate.toISOString().split('T')[0],
            revenue: Number(item._sum?.TotalAmount || 0)
        }));

        // Cache the revenue data in Redis
        const revenueData: CachedRevenueData = {
            data: formattedData,
            lastUpdated: new Date().toISOString()
        };
        await setCachedRevenue(enterpriseId, revenueData);

        return NextResponse.json({
            success: true,
            data: formattedData,
            lastUpdated: new Date().toISOString(),
            fromCache: false
        });

    } catch (error) {
        console.error("Error fetching revenue data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
