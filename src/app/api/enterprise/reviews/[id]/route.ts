import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await context.params;

  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth.success || auth.user?.role !== "Enterprise") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supportsVisibility = await hasIsHiddenColumn();
    if (!supportsVisibility) {
      return NextResponse.json(
        { error: "Visibility controls are not enabled yet. Please run the latest database migration." },
        { status: 400 }
      );
    }

    const accountId = auth.user!.id;
    const enterprise = await prisma.enterprise.findUnique({
      where: { AccountID: accountId },
      select: { EnterpriseID: true }
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
    }

    const { isHidden } = await request.json();

    if (typeof isHidden !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload: isHidden must be a boolean" },
        { status: 400 }
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { ReviewID: reviewId },
      select: { EnterpriseID: true }
    });

    if (!existingReview || existingReview.EnterpriseID !== enterprise.EnterpriseID) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const updatedReview = await prisma.review.update({
      where: { ReviewID: reviewId },
      data: {
        IsHidden: isHidden,
        UpdatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      reviewId: updatedReview.ReviewID,
      isHidden: updatedReview.IsHidden
    });
  } catch (error) {
    console.error("Error updating review visibility:", error);
    return NextResponse.json(
      { error: "Failed to update review visibility" },
      { status: 500 }
    );
  }
}

