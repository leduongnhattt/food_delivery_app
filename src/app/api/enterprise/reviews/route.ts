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

        // Get all reviews for this enterprise
        const reviews = await prisma.review.findMany({
            where: {
                EnterpriseID: enterpriseId
            },
            include: {
                customer: {
                    select: {
                        account: {
                            select: {
                                Username: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                CreatedAt: 'desc'
            }
        });

        // Format the response
        const formattedReviews = reviews.map(review => ({
            id: review.ReviewID,
            customerName: review.customer?.account?.Username || 'Anonymous',
            rating: review.Rating || 0,
            comment: review.Comment || '',
            createdAt: review.CreatedAt.toISOString(),
            helpful: 0 // This would need to be implemented if helpful votes are tracked
        }));

        return NextResponse.json({
            reviews: formattedReviews
        });

    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
