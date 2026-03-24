import { requireEnterprise } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enterpriseId = searchParams.get("enterpriseId");
    if (!enterpriseId) {
      return NextResponse.json(
        { error: "Enterprise ID is required" },
        { status: 400 }
      );
    }
    const menus = await prisma.menu.findMany({
      where: { EnterpriseID: enterpriseId },
      select: {
        MenuID: true,
        MenuName: true,
        Description: true,
      },
      orderBy: { MenuName: "asc" },
    });
    return NextResponse.json({ menus });
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch menus" },
      { status: 500 }
    );
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
    const { MenuName, Description } = body;
    if (!MenuName) {
      return NextResponse.json(
        { error: "Menu name is required" },
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
    const newMenu = await prisma.menu.create({
      data: {
        MenuName,
        Description,
        EnterpriseID: enterprise.EnterpriseID,
      },
    });
    return NextResponse.json({ menu: newMenu }, { status: 201 });
  } catch (error) {
    console.error("Error creating menu:", error);
    return NextResponse.json(
      { error: "Failed to create menu" },
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
    const { MenuID, MenuName, Description } = body;

    if (!MenuID) {
      return NextResponse.json(
        { error: "Menu ID is required" },
        { status: 400 }
      );
    }
    if (!MenuName) {
      return NextResponse.json(
        { error: "Menu name is required" },
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

    const existingMenu = await prisma.menu.findUnique({
      where: { MenuID },
    });
    if (
      !existingMenu ||
      existingMenu.EnterpriseID !== enterprise.EnterpriseID
    ) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const updatedMenu = await prisma.menu.update({
      where: { MenuID },
      data: { MenuName, Description },
    });

    return NextResponse.json({ menu: updatedMenu });
  } catch (error) {
    console.error("Error updating menu:", error);
    return NextResponse.json(
      { error: "Failed to update menu" },
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
    const menuId = searchParams.get("menuId");

    if (!menuId) {
      return NextResponse.json(
        { error: "Menu ID is required" },
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

    const existingMenu = await prisma.menu.findUnique({
      where: { MenuID: menuId },
    });
    if (
      !existingMenu ||
      existingMenu.EnterpriseID !== enterprise.EnterpriseID
    ) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    await prisma.menu.delete({
      where: { MenuID: menuId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu:", error);
    return NextResponse.json(
      { error: "Failed to delete menu" },
      { status: 500 }
    );
  }
}