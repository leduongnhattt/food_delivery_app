import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { invalidateOrdersCache } from "@/lib/orders-cache";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Get authenticated user
        const user = await getAuthenticatedUser(request);
        if (!user.success || user.user?.role !== "Enterprise") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const accountId = user.user!.id;
        const { id: orderId } = await params;

        // Get enterprise ID from account
        const enterprise = await prisma.enterprise.findUnique({
            where: { AccountID: accountId },
            select: { EnterpriseID: true }
        });

        if (!enterprise) {
            return NextResponse.json({ error: "Enterprise not found" }, { status: 404 });
        }

        const enterpriseId = enterprise.EnterpriseID;

        // Check if order exists and belongs to this enterprise
        const order = await prisma.order.findFirst({
            where: {
                OrderID: orderId,
                orderDetails: {
                    some: {
                        food: {
                            EnterpriseID: enterpriseId
                        }
                    }
                }
            },
            include: {
                orderDetails: true
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found or access denied" }, { status: 404 });
        }

        // Use transaction to ensure data consistency
        await prisma.$transaction(async (tx) => {
            // Delete settlement items first (has Restrict constraint)
            await tx.settlementItem.deleteMany({
                where: {
                    OrderID: orderId
                }
            });

            // Delete payments (has Cascade constraint)
            await tx.payment.deleteMany({
                where: {
                    OrderID: orderId
                }
            });

            // Delete order details (has Cascade constraint)
            await tx.orderDetail.deleteMany({
                where: {
                    OrderID: orderId
                }
            });

            // Delete the order
            await tx.order.delete({
                where: {
                    OrderID: orderId
                }
            });
        });

        // Invalidate cache after successful deletion
        await invalidateOrdersCache(enterpriseId);

        return NextResponse.json({
            success: true,
            message: "Order deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting order:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
