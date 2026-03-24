import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

const DEFAULT_LIMIT = 25;

async function hasIsHiddenColumn(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SHOW COLUMNS FROM \`REVIEWS\` LIKE 'IsHidden'
    `;
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.warn("[Enterprise Reviews] Failed to check IsHidden column:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth.success || auth.user?.role !== "Enterprise") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = auth.user!.id;

    const enterprise = await prisma.enterprise.findUnique({
      where: { AccountID: accountId },
      select: { EnterpriseID: true, EnterpriseName: true }
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
    }

    const enterpriseId = enterprise.EnterpriseID;
    const supportsVisibility = await hasIsHiddenColumn();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q")?.trim() || "";
    const ratingFilter = searchParams.get("rating") || "all";
    const status = (searchParams.get("status") || "all") as "all" | "active" | "hidden";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") === "oldest" ? "asc" : "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || DEFAULT_LIMIT.toString(), 10))
    );
    const skip = (page - 1) * limit;

    const where: any = {
      EnterpriseID: enterpriseId
    };

    if (supportsVisibility) {
      if (status === "active") {
        where.IsHidden = false;
      } else if (status === "hidden") {
        where.IsHidden = true;
      }
    }

    if (q) {
      where.OR = [
        { Comment: { contains: q } },
        { customer: { account: { Username: { contains: q } } } }
      ];
    }

    if (ratingFilter !== "all") {
      const ratingValue = parseInt(ratingFilter, 10);
      if (!Number.isNaN(ratingValue) && ratingValue >= 1 && ratingValue <= 5) {
        where.Rating = ratingValue;
      }
    }

    if (startDate || endDate) {
      where.CreatedAt = {};
      if (startDate) {
        where.CreatedAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.CreatedAt.lte = end;
      }
    }

    const averageWhere: any = {
      EnterpriseID: enterpriseId,
      Rating: {
        not: null,
        gte: 1,
        lte: 5
      }
    };
    if (supportsVisibility) {
      averageWhere.IsHidden = false;
    }

    const [reviews, total, averageStats, ratingCounts] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: {
            select: {
              account: {
                select: {
                  Username: true,
                  Email: true
                }
              }
            }
          }
        },
        orderBy: { CreatedAt: sort },
        skip,
        take: limit
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({
        where: averageWhere,
        _avg: { Rating: true },
        _count: { Rating: true }
      }),
      prisma.review.groupBy({
        by: ["Rating"],
        _count: { Rating: true },
        where: {
          EnterpriseID: enterpriseId,
          Rating: {
            not: null,
            gte: 1,
            lte: 5
          }
        }
      })
    ]);

    let hiddenCount = 0;
    let visibleCount = total;

    if (supportsVisibility) {
      const [hidden, visible] = await Promise.all([
        prisma.review.count({
          where: {
            EnterpriseID: enterpriseId,
            IsHidden: true
          }
        }),
        prisma.review.count({
          where: {
            EnterpriseID: enterpriseId,
            IsHidden: false
          }
        })
      ]);
      hiddenCount = hidden;
      visibleCount = visible;
    }

    const formattedReviews = reviews.map((review) => ({
      id: review.ReviewID,
      customerName: review.customer?.account?.Username || "Anonymous",
      customerEmail: review.customer?.account?.Email || null,
      rating: review.Rating || 0,
      comment: review.Comment || "",
      createdAt: review.CreatedAt.toISOString(),
      updatedAt: review.UpdatedAt?.toISOString() || null,
      images: Array.isArray(review.Images) ? (review.Images as string[]) : [],
      isHidden: supportsVisibility ? Boolean((review as any).IsHidden) : false
    }));

    const ratingDistribution: Record<string, number> = {
      "5": 0,
      "4": 0,
      "3": 0,
      "2": 0,
      "1": 0
    };

    ratingCounts.forEach((group) => {
      if (group.Rating) {
        ratingDistribution[String(group.Rating)] = group._count.Rating;
      }
    });

    return NextResponse.json({
      success: true,
      reviews: formattedReviews,
      stats: {
        averageRating: Math.round((averageStats._avg.Rating || 0) * 10) / 10,
        totalReviews: averageStats._count.Rating || 0,
        ratingDistribution,
        visibleCount,
        hiddenCount,
        supportsVisibility
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      features: {
        visibilityToggle: supportsVisibility
      }
    });
  } catch (error) {
    console.error("Error fetching enterprise reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
