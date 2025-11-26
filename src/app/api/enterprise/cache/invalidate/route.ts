import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import {
    invalidateOrdersCache,
    invalidateSpecificCache,
    getCacheStats
} from "@/lib/orders-cache";

export async function POST(request: NextRequest) {
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
            select: { EnterpriseID: true }
        });

        if (!enterprise) {
            return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
        }

        const enterpriseId = enterprise.EnterpriseID;
        const body = await request.json();
        const { cacheType } = body;

        if (cacheType) {
            // Invalidate specific cache type
            await invalidateSpecificCache(enterpriseId, cacheType);
            return NextResponse.json({
                success: true,
                message: `Cache invalidated for ${cacheType}`,
                cacheType
            });
        } else {
            // Invalidate all caches
            await invalidateOrdersCache(enterpriseId);
            return NextResponse.json({
                success: true,
                message: "All caches invalidated"
            });
        }

    } catch (error) {
        console.error("Error invalidating cache:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

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
            select: { EnterpriseID: true }
        });

        if (!enterprise) {
            return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
        }

        const enterpriseId = enterprise.EnterpriseID;

        // Get cache statistics
        const cacheStats = await getCacheStats(enterpriseId);

        return NextResponse.json({
            success: true,
            cacheStats,
            enterpriseId
        });

    } catch (error) {
        console.error("Error getting cache stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
