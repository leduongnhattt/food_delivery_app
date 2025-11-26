import { buildHeaders } from "@/lib/http-client";
import { useState } from "react";

interface UploadResponse {
  message: string;
  url: string;
  filename: string;
}

interface ErrorResponse {
  error: string;
}

export const useEnterpriseUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No auth token found");
      }

      // Validate file type on client side
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed"
        );
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error("File size too large. Maximum size is 5MB");
      }

      const formData = new FormData();
      formData.append("file", file);

      // Use buildHeaders() but remove JSON Content-Type so FormData boundary is set by the browser
      const headers = buildHeaders() as Record<string, string>
      delete headers['Content-Type']

      const response = await fetch("/api/enterprise/food-image", {
        method: "POST",
        headers,
        body: formData,
      });

      if (response.ok) {
        const data: UploadResponse = await response.json();
        return data.url;
      } else {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload image";
      setUploadError(errorMessage);
      console.error("Error uploading image:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (imageUrlToDelete?: string): Promise<boolean> => {
    void imageUrlToDelete
    // Images are stored on Cloudinary; we keep DB as source of truth and do not delete remote asset here.
    // Always succeed to avoid blocking deletion of food records.
    return true;
  };

  const resetErrors = () => {
    setUploadError(null);
    setDeleteError(null);
  };

  return {
    uploadImage,
    deleteImage,
    isUploading,
    uploadError,
    deleteError,
    resetErrors,
  };
};
