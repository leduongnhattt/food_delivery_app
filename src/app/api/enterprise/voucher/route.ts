import { requireEnterprise } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { invalidateApprovedVouchersCache } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

// Invalidate customer-visible vouchers cache only when voucher is Approved
async function invalidateIfApproved(status: string | null | undefined): Promise<void> {
  if (status === 'Approved') {
    await invalidateApprovedVouchersCache();
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireEnterprise(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user!;
    const body = await request.json();
    const { Code, ExpiryDate, DiscountPercent, DiscountAmount, MinOrderValue, MaxUsage } = body;
    if (!Code) {
      return NextResponse.json(
        { error: "Coupon Code is required" },
        { status: 400 }
      );
    }
    if (!ExpiryDate) {
      return NextResponse.json(
        { error: "Expiry Date is required" },
        { status: 400 }
      );
    }
    if (!DiscountPercent && !DiscountAmount) {
      return NextResponse.json(
        { error: "Either Discount Percent or Discount Amount is required" },
        { status: 400 }
      );
    }

    const enterprise = await prisma.enterprise.findUnique({
      where: { AccountID: user.id },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise profile not found" },
        { status: 404 }
      );
    }
    const newVoucher = await prisma.voucher.create({
      data: {
        Code,
        ExpiryDate: new Date(ExpiryDate),
        DiscountPercent: DiscountPercent || null,
        DiscountAmount: DiscountAmount || null,
        MinOrderValue: MinOrderValue || null,
        MaxUsage: MaxUsage || null,
        CreatedBy: 'Business',
        EnterpriseID: enterprise.EnterpriseID,
      },
    });
    // If policies auto-approve, refresh customer list cache
    await invalidateIfApproved(newVoucher.Status);
    return NextResponse.json({ voucher: newVoucher }, { status: 201 });
  } catch (error) {
    console.error("Error creating voucher:", error);
    return NextResponse.json(
      { error: "Failed to create voucher" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireEnterprise(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user!;
    const body = await request.json();
    const { VoucherID, Code, ExpiryDate, DiscountPercent, DiscountAmount, MinOrderValue, MaxUsage } = body;

    if (!VoucherID) {
      return NextResponse.json(
        { error: "Voucher ID is required" },
        { status: 400 }
      );
    }

    if (!Code) {
      return NextResponse.json(
        { error: "Coupon Code is required" },
        { status: 400 }
      );
    }

    if (!ExpiryDate) {
      return NextResponse.json(
        { error: "Expiry Date is required" },
        { status: 400 }
      );
    }

    if (!DiscountPercent && !DiscountAmount) {
      return NextResponse.json(
        { error: "Either Discount Percent or Discount Amount is required" },
        { status: 400 }
      );
    }

    // Validate discount percentage range if provided
    if (DiscountPercent && (DiscountPercent < 1 || DiscountPercent > 100)) {
      return NextResponse.json(
        { error: "Discount percentage must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Validate discount amount if provided
    if (DiscountAmount && DiscountAmount <= 0) {
      return NextResponse.json(
        { error: "Discount amount must be greater than 0" },
        { status: 400 }
      );
    }

    const enterprise = await prisma.enterprise.findUnique({
      where: { AccountID: user.id },
    });

    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise profile not found" },
        { status: 404 }
      );
    }

    // Check if voucher exists and belongs to this enterprise
    const existingVoucher = await prisma.voucher.findFirst({
      where: {
        VoucherID: VoucherID,
        EnterpriseID: enterprise.EnterpriseID,
      },
    });

    if (!existingVoucher) {
      return NextResponse.json(
        { error: "Voucher not found or access denied" },
        { status: 404 }
      );
    }

    // Check if the new code already exists for this enterprise (excluding current voucher)
    const codeExists = await prisma.voucher.findFirst({
      where: {
        Code: Code,
        EnterpriseID: enterprise.EnterpriseID,
        VoucherID: { not: VoucherID },
      },
    });

    if (codeExists) {
      return NextResponse.json(
        { error: "Voucher code already exists" },
        { status: 400 }
      );
    }

    const updatedVoucher = await prisma.voucher.update({
      where: {
        VoucherID: VoucherID,
      },
      data: {
        Code,
        ExpiryDate: new Date(ExpiryDate),
        DiscountPercent: DiscountPercent || null,
        DiscountAmount: DiscountAmount || null,
        MinOrderValue: MinOrderValue || null,
        MaxUsage: MaxUsage || null,
      },
    });
    // If an Approved voucher was edited, refresh customer list cache
    await invalidateIfApproved(updatedVoucher.Status);
    return NextResponse.json({ voucher: updatedVoucher }, { status: 200 });
  } catch (error) {
    console.error("Error updating voucher:", error);
    return NextResponse.json(
      { error: "Failed to update voucher" },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireEnterprise(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    const user = authResult.user!;
    const { searchParams } = new URL(request.url);
    const voucherId = searchParams.get("voucherId");
    if (!voucherId) {
      return NextResponse.json(
        { error: "Voucher ID is required" },
        { status: 400 }
      );
    }
    const enterprise = await prisma.enterprise.findUnique({
      where: { AccountID: user.id },
    });
    if (!enterprise) {
      return NextResponse.json(
        { error: "Enterprise profile not found" },
        { status: 404 }
      );
    }
    const existingVoucher = await prisma.voucher.findFirst({
      where: {
        VoucherID: voucherId,
        EnterpriseID: enterprise.EnterpriseID,
      },
    });
    if (!existingVoucher) {
      return NextResponse.json(
        { error: "Voucher not found or access denied" },
        { status: 404 }
      );
    }
    const deleted = await prisma.voucher.delete({
      where: { VoucherID: voucherId },
    });
    await invalidateIfApproved(deleted.Status);
    return NextResponse.json({ message: "Voucher deleted successfully" });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    return NextResponse.json(
      { error: "Failed to delete voucher" },
      { status: 500 }
    );
  }
}