"use client";

import { apiClient } from "@/services/api";

export type EnterpriseReview = {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string | null;
  images: string[];
  isHidden: boolean;
};

export type EnterpriseReviewStats = {
  averageRating: number;
  totalReviews: number;
  visibleCount: number;
  hiddenCount: number;
  ratingDistribution: Record<string, number>;
  supportsVisibility: boolean;
};

export type ReviewFilters = {
  q?: string;
  rating?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
};

export async function fetchEnterpriseReviews(filters: ReviewFilters = {}) {
  const response = (await apiClient.get("/enterprise/reviews", filters)) as any;
  if (response?.success === false) {
    return {
      success: false,
      error: response.error || "Failed to fetch reviews",
      reviews: [],
      stats: null,
      features: response.features || {}
    };
  }
  return response;
}

export async function requestReviewVisibility(reviewId: string, action: "hide" | "show", reason: string) {
  return apiClient.post("/enterprise/reviews/request", {
    reviewId,
    action,
    reason
  });
}

