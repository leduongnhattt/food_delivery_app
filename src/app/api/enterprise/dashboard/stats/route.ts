import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
    getCachedStats,
    setCachedStats,
    CachedStatsData
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
        const cachedStats = await getCachedStats(enterpriseId);
        if (cachedStats) {
            return NextResponse.json({
                success: true,
                ...cachedStats,
                fromCache: true
            });
        }

        // Get dashboard statistics from database
        const [
            totalOrders,
            totalRevenue,
            totalCustomers,
            totalProducts,
            pendingOrders,
            completedOrders,
            averageRating,
            lastMonthStats
        ] = await Promise.all([
            // Total orders (through orderDetails -> food -> enterprise)
            prisma.order.count({
                where: {
                    orderDetails: {
                        some: {
                            food: {
                                EnterpriseID: enterpriseId
                            }
                        }
                    }
                }
            }),

            // Total revenue
            prisma.order.aggregate({
                where: {
                    Status: "Completed",
                    orderDetails: {
                        some: {
                            food: {
                                EnterpriseID: enterpriseId
                            }
                        }
                    }
                },
                _sum: {
                    TotalAmount: true
                }
            }),

            // Total customers (unique customers who have orders)
            prisma.order.groupBy({
                by: ['CustomerID'],
                where: {
                    orderDetails: {
                        some: {
                            food: {
                                EnterpriseID: enterpriseId
                            }
                        }
                    }
                }
            }).then(result => result.length),

            // Total products
            prisma.food.count({
                where: {
                    EnterpriseID: enterpriseId
                }
            }),

            // Pending orders
            prisma.order.count({
                where: {
                    Status: "Pending",
                    orderDetails: {
                        some: {
                            food: {
                                EnterpriseID: enterpriseId
                            }
                        }
                    }
                }
            }),

            // Completed orders
            prisma.order.count({
                where: {
                    Status: "Completed",
                    orderDetails: {
                        some: {
                            food: {
                                EnterpriseID: enterpriseId
                            }
                        }
                    }
                }
            }),

            // Average rating
            prisma.review.aggregate({
                where: {
                    EnterpriseID: enterpriseId
                },
                _avg: {
                    Rating: true
                }
            }),

            // Last month stats for growth calculation
            prisma.order.aggregate({
                where: {
                    orderDetails: {
                        some: {
                            food: {
                                EnterpriseID: enterpriseId
                            }
                        }
                    },
                    OrderDate: {
                        gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                    }
                },
                _count: {
                    OrderID: true
                },
                _sum: {
                    TotalAmount: true
                }
            })
        ]);

        // Calculate growth percentages
        const currentMonth = new Date();
        const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);

        const [currentMonthStats] = await Promise.all([
            prisma.order.aggregate({
                where: {
                    orderDetails: {
                        some: {
                            food: {
                                EnterpriseID: enterpriseId
                            }
                        }
                    },
                    OrderDate: {
                        gte: lastMonth
                    }
                },
                _count: {
                    OrderID: true
                },
                _sum: {
                    TotalAmount: true
                }
            })
        ]);

        const lastMonthRevenue = Number(lastMonthStats._sum?.TotalAmount || 0);
        const currentMonthRevenue = Number(currentMonthStats._sum?.TotalAmount || 0);
        const lastMonthOrders = lastMonthStats._count?.OrderID || 0;
        const currentMonthOrders = currentMonthStats._count?.OrderID || 0;

        const revenueGrowth = lastMonthRevenue > 0
            ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        const orderGrowth = lastMonthOrders > 0
            ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
            : 0;

        const statsData: CachedStatsData = {
            totalOrders: totalOrders || 0,
            totalRevenue: Number(totalRevenue._sum?.TotalAmount || 0),
            totalCustomers: totalCustomers || 0,
            totalProducts: totalProducts || 0,
            pendingOrders: pendingOrders || 0,
            completedOrders: completedOrders || 0,
            averageRating: Number(averageRating._avg?.Rating || 0),
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            orderGrowth: Math.round(orderGrowth * 100) / 100,
            lastUpdated: new Date().toISOString()
        };

        // Cache the stats data in Redis
        await setCachedStats(enterpriseId, statsData);

        return NextResponse.json({
            success: true,
            ...statsData,
            fromCache: false
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
