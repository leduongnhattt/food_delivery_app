"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import type {
  ReviewFilters,
  EnterpriseReview,
  EnterpriseReviewStats
} from "@/services/enterprise-reviews";
import {
  fetchEnterpriseReviews,
  requestReviewVisibility
} from "@/services/enterprise-reviews";
import {
  EnterpriseMenuSelect,
  type EnterpriseMenuSelectOption,
} from "@/components/enterprise/orders/EnterpriseMenuSelect";
import { EnterprisePageHeader, ENTERPRISE_PANEL_CLASS } from "@/components/enterprise/EnterprisePageHeader";

const defaultFilters: Required<ReviewFilters> = {
  q: "",
  rating: "all",
  status: "all",
  startDate: "",
  endDate: "",
  sort: "newest"
};

const ratingOptions = [
  { label: "All ratings", value: "all" },
  { label: "5 stars", value: "5" },
  { label: "4 stars", value: "4" },
  { label: "3 stars", value: "3" },
  { label: "2 stars", value: "2" },
  { label: "1 star", value: "1" }
];

const ratingMenuOptions: EnterpriseMenuSelectOption[] = ratingOptions.map((o) => ({
  value: o.value,
  label: o.label,
}));

const sortMenuOptions: EnterpriseMenuSelectOption[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const filterKeys: Array<keyof ReviewFilters> = ["q", "rating", "status", "startDate", "endDate", "sort"];

function normalizeFilters(filters: ReviewFilters): Required<ReviewFilters> {
  return {
    q: filters.q ?? "",
    rating: filters.rating ?? "all",
    status: filters.status ?? "all",
    startDate: filters.startDate ?? "",
    endDate: filters.endDate ?? "",
    sort: filters.sort ?? "newest"
  };
}

function areFiltersEqual(a: ReviewFilters, b: ReviewFilters) {
  return filterKeys.every((key) => (a[key] ?? "") === (b[key] ?? ""));
}

export default function EnterpriseReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const buildFiltersFromSearchParams = useCallback((): ReviewFilters => {
    const params = searchParams;
    return {
      q: params.get("q") || "",
      rating: params.get("rating") || "all",
      status: params.get("status") || "all",
      startDate: params.get("startDate") || "",
      endDate: params.get("endDate") || "",
      sort: params.get("sort") || "newest"
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<ReviewFilters>(() => buildFiltersFromSearchParams());
  const [reviews, setReviews] = useState<EnterpriseReview[]>([]);
  const [stats, setStats] = useState<EnterpriseReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supportsVisibility, setSupportsVisibility] = useState(true);
  const [requestReview, setRequestReview] = useState<EnterpriseReview | null>(null);
  const [requestAction, setRequestAction] = useState<"hide" | "show">("hide");
  const [requestReason, setRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    const next = buildFiltersFromSearchParams();
    setFilters((prev) => (areFiltersEqual(prev, next) ? prev : next));
  }, [buildFiltersFromSearchParams]);

  const updateURL = (nextFilters: ReviewFilters) => {
    const normalized = normalizeFilters(nextFilters);
    const params = new URLSearchParams();
    Object.entries(normalized).forEach(([key, value]) => {
      if (!value) return;
      if (["rating", "status", "sort"].includes(key) && value === "all") return;
      params.set(key, value);
    });
    const queryString = params.toString();
    router.replace(
      queryString ? `/enterprise/reviews?${queryString}` : "/enterprise/reviews",
      { scroll: false }
    );
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams: Record<string, string> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (!value) return;
        if (key === "rating" && value === "all") return;
        if (key === "status" && value === "all") return;
        queryParams[key] = value;
      });

      const response = await fetchEnterpriseReviews(queryParams);

      if (response?.success === false) {
        showToast(response.error || "Failed to fetch reviews", "error");
        setReviews([]);
        setStats(null);
        setSupportsVisibility(response.features?.visibilityToggle !== false);
        return;
      }

      setReviews(response?.reviews || []);
      setStats(response?.stats || null);
      setSupportsVisibility(response?.features?.visibilityToggle !== false);
    } catch (error) {
      console.error(error);
      showToast("Failed to load reviews", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleFilterChange = (key: keyof ReviewFilters, value: string) => {
    if (key === "status" && !supportsVisibility) {
      showToast("Visibility filters will be available after running the latest migration.", "warning");
      return;
    }
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    updateURL(nextFilters);
  };

  const openRequestModal = (review: EnterpriseReview) => {
    setRequestReview(review);
    setRequestAction(review.isHidden ? "show" : "hide");
    setRequestReason("");
  };

  const handleSubmitRequest = async () => {
    if (!requestReview) return;
    if (!requestReason.trim()) {
      showToast("Please provide a reason for the request.", "warning");
      return;
    }

    setSubmittingRequest(true);
    try {
      const response = await requestReviewVisibility(
        requestReview.id,
        requestAction,
        requestReason.trim()
      );
      if ((response as any)?.success === false) {
        throw new Error((response as any)?.error || "Failed to submit request");
      }

      showToast("Request sent to system team. You'll be notified when it's processed.", "success");
      setRequestReview(null);
      setRequestReason("");
    } catch (error) {
      console.error(error);
      showToast("Failed to submit request", "error");
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnterprisePageHeader
        title="Customer Feedback"
        description="Monitor ratings and moderate reviews left for your restaurant."
        actions={
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchReviews();
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
                Refreshing
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </>
            )}
          </button>
        }
      />

      {/* Overview cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className={`${ENTERPRISE_PANEL_CLASS} p-5`}>
            <p className="text-sm text-slate-500">Average Rating</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-bold text-slate-900">
                {stats?.averageRating?.toFixed(1) || "0.0"}
              </span>
              <span className="text-sm text-slate-500">/ 5.0</span>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`w-4 h-4 ${
                    index < Math.round(stats?.averageRating || 0)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className={`${ENTERPRISE_PANEL_CLASS} p-5`}>
            <p className="text-sm text-slate-500">Total Reviews</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats?.totalReviews ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Visible {stats?.visibleCount ?? 0} • Hidden {stats?.hiddenCount ?? 0}
            </p>
          </div>

          <div className={`${ENTERPRISE_PANEL_CLASS} p-5`}>
            <p className="text-sm text-slate-500">Visible</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {stats?.visibleCount ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Live on restaurant page</p>
          </div>

          <div className={`${ENTERPRISE_PANEL_CLASS} p-5`}>
            <p className="text-sm text-slate-500">Hidden</p>
            <p className="mt-2 text-3xl font-bold text-rose-600">
              {stats?.hiddenCount ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Not visible to customers</p>
          </div>
        </div>

        {/* Filters */}
        <div className={`${ENTERPRISE_PANEL_CLASS} space-y-4 p-5`}>
          {!supportsVisibility && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Filter className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                Review visibility filters and actions will be enabled after your database includes the
                <code className="px-1 mx-1 rounded bg-amber-100 text-amber-900">IsHidden</code>
                column. Please run the latest migration to unlock this feature.
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={filters.q}
                onChange={(e) => handleFilterChange("q", e.target.value)}
                placeholder="Search by customer or comment"
                className="w-full h-9 min-h-9 rounded-xl border border-slate-200 bg-white/80 py-0 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <EnterpriseMenuSelect
              value={filters.rating ?? "all"}
              onChange={(v) => handleFilterChange("rating", v)}
              options={ratingMenuOptions}
              className="w-full min-w-0"
              menuClassName="min-w-[12rem]"
              triggerClassName="rounded-xl"
              aria-label="Filter by rating"
            />

            <div className="flex rounded-xl border border-slate-200 overflow-hidden">
              {["all", "active", "hidden"].map((status) => {
                const disabled = status !== "all" && !supportsVisibility;
                return (
                  <button
                    key={status}
                    onClick={() => handleFilterChange("status", status)}
                    disabled={disabled}
                    className={`flex-1 px-3 py-2 text-sm font-medium capitalize ${
                      filters.status === status
                        ? "bg-indigo-500 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>

            <EnterpriseMenuSelect
              value={filters.sort ?? "newest"}
              onChange={(v) => handleFilterChange("sort", v)}
              options={sortMenuOptions}
              className="w-full min-w-0"
              alignMenu="right"
              menuClassName="min-w-[11rem]"
              triggerClassName="rounded-xl"
              aria-label="Sort reviews"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white/80 py-2 px-3 text-sm focus:border-indigo-400 focus:ring-indigo-200"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white/80 py-2 px-3 text-sm focus:border-indigo-400 focus:ring-indigo-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <button
                onClick={() => {
                  setFilters(defaultFilters);
                  updateURL(defaultFilters);
                }}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600"
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>

        {/* Reviews table */}
        <div className={`${ENTERPRISE_PANEL_CLASS} overflow-hidden`}>
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No reviews found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Comment</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white/60">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold flex items-center justify-center">
                            {review.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{review.customerName}</p>
                            {review.customerEmail && (
                              <p className="text-xs text-slate-500">{review.customerEmail}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                className={`w-4 h-4 ${
                                  index < review.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-slate-600">{review.rating}/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md">
                        <p className="text-sm text-slate-700 line-clamp-3">{review.comment || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(review.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            review.isHidden
                              ? "bg-rose-50 text-rose-700 border border-rose-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}
                        >
                          {review.isHidden ? "Hidden" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openRequestModal(review)}
                          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          {review.isHidden ? (
                            <>
                              <Eye className="w-4 h-4" />
                              Request show
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Request hide
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {requestReview && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-wide">Review moderation</p>
                <h3 className="text-xl font-semibold text-slate-900">
                  Request to {requestAction === "hide" ? "hide" : "show"} review
                </h3>
              </div>
              <button
                onClick={() => setRequestReview(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-800">{requestReview.customerName}</p>
                <p className="mt-1">{requestReview.comment || "No comment provided"}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Rating: {requestReview.rating}/5 • Created{" "}
                  {new Date(requestReview.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Requested action</label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                  {(["hide", "show"] as const).map((action) => (
                    <button
                      key={action}
                      onClick={() => setRequestAction(action)}
                      className={`flex-1 px-4 py-2 text-sm font-semibold capitalize ${
                        requestAction === action
                          ? "bg-indigo-500 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Reason for request <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm focus:border-indigo-400 focus:ring-indigo-200"
                  placeholder="Explain why this review should be moderated ..."
                />
                <p className="text-xs text-slate-500">
                  Requests are reviewed by the system administrators. You will receive a response via
                  support inbox.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setRequestReview(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                disabled={submittingRequest}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={submittingRequest}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submittingRequest ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
