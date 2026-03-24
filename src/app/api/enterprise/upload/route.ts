import { requireEnterprise } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  const authResult = await requireEnterprise(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `enterprise_${timestamp}${fileExtension}`;

    // Ensure upload directory exists
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "images",
      "enterprise"
    );
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // Return the public URL
    const imageUrl = `/images/enterprise/${fileName}`;

    return NextResponse.json({
      message: "File uploaded successfully",
      url: imageUrl,
      filename: fileName,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireEnterprise(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Validate that the URL is from our enterprise folder
    if (!imageUrl.startsWith("/images/enterprise/")) {
      return NextResponse.json(
        { error: "Invalid image URL. Only enterprise images can be deleted" },
        { status: 400 }
      );
    }

    // Extract filename from URL
    const filename = path.basename(imageUrl);

    // Validate filename format (should start with "enterprise_" and have timestamp)
    if (!filename.match(/^enterprise_\d+\.(jpg|jpeg|png|gif|webp)$/i)) {
      return NextResponse.json(
        { error: "Invalid filename format" },
        { status: 400 }
      );
    }

    // Construct file path
    const filePath = path.join(
      process.cwd(),
      "public",
      "images",
      "enterprise",
      filename
    );

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete the file
    await unlink(filePath);

    return NextResponse.json({
      message: "File deleted successfully",
      deletedUrl: imageUrl,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

