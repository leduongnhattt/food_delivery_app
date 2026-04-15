"use client";

import { getServerApiBase, requestJson } from "@/lib/http-client";

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

export type EnterpriseReviewsFeatures = {
  visibilityToggle?: boolean;
};

export type EnterpriseReviewsSuccessResponse = {
  success?: true;
  reviews: EnterpriseReview[];
  stats: EnterpriseReviewStats | null;
  features?: EnterpriseReviewsFeatures;
};

export type EnterpriseReviewsErrorResponse = {
  success: false;
  error?: string;
  features?: EnterpriseReviewsFeatures;
};

export type EnterpriseReviewsResponse =
  | EnterpriseReviewsSuccessResponse
  | EnterpriseReviewsErrorResponse;

export async function fetchEnterpriseReviews(
  filters: ReviewFilters = {}
): Promise<EnterpriseReviewsResponse> {
  const base = getServerApiBase().replace(/\/$/, "");
  const search = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  });
  const qs = search.toString();
  const url = qs ? `${base}/enterprise/reviews?${qs}` : `${base}/enterprise/reviews`;
  return requestJson<EnterpriseReviewsResponse>(url, { method: "GET" });
}

export async function requestReviewVisibility(reviewId: string, action: "hide" | "show", reason: string) {
  const base = getServerApiBase().replace(/\/$/, "");
  return requestJson(`${base}/enterprise/reviews/request`, {
    method: "POST",
    body: JSON.stringify({ reviewId, action, reason }),
  });
}

