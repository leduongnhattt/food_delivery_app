import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await prisma.foodCategory.findMany({
      select: {
        CategoryID: true,
        CategoryName: true,
        Description: true,
      },
      orderBy: { CategoryName: "asc" },
    });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}