import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthenticatedUser(request);
        if (!user.success || user.user?.role !== "Enterprise") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to Cloudinary
        const uploadResult = await uploadBufferToCloudinary(buffer, file.type, {
            folder: "enterprise/avatars"
        });

        if (!uploadResult) {
            return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
        }

        // Update avatar URL in database
        await prisma.account.update({
            where: { AccountID: user.user!.id },
            data: { Avatar: uploadResult }
        });

        return NextResponse.json({
            url: uploadResult,
            message: "Avatar updated successfully"
        });

    } catch (error) {
        console.error("Error uploading avatar:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
