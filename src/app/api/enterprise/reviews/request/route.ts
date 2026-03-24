import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);

    if (!auth.success || auth.user?.role !== "Enterprise") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId, action, reason } = body as {
      reviewId?: string;
      action?: "hide" | "show";
      reason?: string;
    };

    if (!reviewId || !action || !reason?.trim()) {
      return NextResponse.json(
        { error: "reviewId, action and reason are required" },
        { status: 400 }
      );
    }

    const sanitizedReason = reason.trim();
    if (sanitizedReason.length < 8) {
      return NextResponse.json(
        { error: "Reason should be at least 8 characters" },
        { status: 400 }
      );
    }

    const accountId = auth.user!.id;
    const enterprise = await prisma.enterprise.findUnique({
      where: { AccountID: accountId },
      select: { EnterpriseID: true, EnterpriseName: true }
    });

    if (!enterprise) {
      return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
    }

    const review = await prisma.review.findUnique({
      where: { ReviewID: reviewId },
      select: {
        EnterpriseID: true,
        Rating: true,
        Comment: true,
        CreatedAt: true,
        IsHidden: true
      }
    });

    if (!review || review.EnterpriseID !== enterprise.EnterpriseID) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const subject = `Review visibility request (${action.toUpperCase()})`;
    const descriptionLines = [
      `Review ID: ${reviewId}`,
      `Enterprise: ${enterprise.EnterpriseName || enterprise.EnterpriseID}`,
      `Current status: ${review.IsHidden ? "Hidden" : "Active"}`,
      `Requested action: ${action === "hide" ? "Hide from public listing" : "Restore to public listing"}`,
      `Rating: ${review.Rating ?? "N/A"}`,
      `Comment: ${review.Comment || "No comment provided"}`,
      `Reason: ${sanitizedReason}`
    ];

    const supportTicket = await prisma.support.create({
      data: {
        AccountID: accountId,
        Subject: subject,
        Description: descriptionLines.join(" | ")
      }
    });

    return NextResponse.json({
      success: true,
      ticketId: supportTicket.MessageID
    });
  } catch (error) {
    console.error("Error creating review visibility request:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}

