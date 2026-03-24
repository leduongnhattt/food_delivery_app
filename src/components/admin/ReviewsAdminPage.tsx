"use client"

import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import ReviewSearch from "@/components/admin/ReviewSearch"
import TabsReviews from "@/components/admin/TabsReviews"
import EnterpriseFilter from "@/components/admin/EnterpriseFilter"
import AdminReviewRow from "@/app/admin/reviews/AdminReviewRow"
import { getAdminReviews } from "@/services/review.service"
import { listAdminEnterprises } from "@/services/admin.service"
import type { AdminReviewRowModel } from "@/types/admin-api.types"

function mapApiToRow(
  r: Awaited<ReturnType<typeof getAdminReviews>>["reviews"][number],
): AdminReviewRowModel {
  return {
    ReviewID: r.id,
    Rating: r.rating,
    Comment: r.comment,
    CreatedAt: new Date(r.createdAt),
    UpdatedAt: r.updatedAt ? new Date(r.updatedAt) : null,
    Images: r.images,
    IsHidden: r.isHidden,
    customer: {
      account: {
        Username: r.customerName,
        Email: r.customerEmail || null,
      },
    },
    enterprise: {
      EnterpriseID: r.enterpriseId,
      EnterpriseName: r.enterpriseName,
    },
  }
}

export default function ReviewsAdminPage() {
  const searchParams = useSearchParams()
  const status = (searchParams.get("status") || "all") as
    | "all"
    | "active"
    | "hidden"
  const q = (searchParams.get("q") || "").trim()
  const enterpriseId = searchParams.get("enterpriseId") || ""
  const startDate = searchParams.get("startDate") || ""
  const endDate = searchParams.get("endDate") || ""

  const [reviews, setReviews] = useState<AdminReviewRowModel[]>([])
  const [enterprises, setEnterprises] = useState<
    { EnterpriseID: string; EnterpriseName: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [revRes, entRes] = await Promise.all([
        getAdminReviews({
          q: q || undefined,
          enterpriseId: enterpriseId || undefined,
          status,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        listAdminEnterprises({ status: "all", search: "" }),
      ])
      setReviews(revRes.reviews.map(mapApiToRow))
      setEnterprises(
        entRes.items.map((e) => ({
          EnterpriseID: e.EnterpriseID,
          EnterpriseName: e.EnterpriseName,
        })),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reviews")
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [status, q, enterpriseId, startDate, endDate])

  useEffect(() => {
    void load()
  }, [load])

  const filteredReviews = reviews

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Reviews
          </h1>
          <p className="text-slate-600 mt-1">
            Manage all customer reviews and ratings
          </p>
        </div>
        <ReviewSearch
          currentStatus={status}
          currentSearch={q}
          currentEnterpriseId={enterpriseId}
          currentStartDate={startDate}
          currentEndDate={endDate}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <TabsReviews
            current={status}
            search={q}
            enterpriseId={enterpriseId}
            startDate={startDate}
            endDate={endDate}
          />
          <EnterpriseFilter
            enterprises={enterprises}
            currentEnterpriseId={enterpriseId}
            currentStatus={status}
            currentSearch={q}
            currentStartDate={startDate}
            currentEndDate={endDate}
          />
        </div>

        {(q ||
          status !== "all" ||
          enterpriseId ||
          startDate ||
          endDate) &&
          !loading && (
            <div className="mt-4 mb-2 text-sm text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                {q && (
                  <span>
                    Found {filteredReviews.length} review
                    {filteredReviews.length !== 1 ? "s" : ""} matching &quot;{q}
                    &quot;
                  </span>
                )}
                {!q && (
                  <span>
                    Showing {filteredReviews.length}{" "}
                    {status === "all" ? "" : status} review
                    {filteredReviews.length !== 1 ? "s" : ""}
                  </span>
                )}
                {enterpriseId &&
                  enterprises.find((e) => e.EnterpriseID === enterpriseId) && (
                    <span className="text-slate-500">
                      •{" "}
                      {
                        enterprises.find(
                          (e) => e.EnterpriseID === enterpriseId,
                        )?.EnterpriseName
                      }
                    </span>
                  )}
                {(startDate || endDate) && (
                  <span className="text-slate-500">
                    •{" "}
                    {startDate
                      ? new Date(startDate).toLocaleDateString()
                      : "Start"}{" "}
                    -{" "}
                    {endDate
                      ? new Date(endDate).toLocaleDateString()
                      : "End"}
                  </span>
                )}
              </div>
            </div>
          )}

        {error && (
          <div className="mt-4 rounded-lg bg-rose-50 text-rose-800 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Loading…</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4">Customer</th>
                  <th className="py-2 pr-4">Restaurant</th>
                  <th className="py-2 pr-4">Rating</th>
                  <th className="py-2 pr-4">Comment</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center text-slate-500 py-8"
                    >
                      No reviews found
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <AdminReviewRow
                      key={review.ReviewID}
                      review={review}
                      onPatched={() => void load()}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
