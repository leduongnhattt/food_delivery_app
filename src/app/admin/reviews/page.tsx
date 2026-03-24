import { Suspense } from "react"
import ReviewsAdminPage from "@/components/admin/ReviewsAdminPage"

export default function AdminReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">Loading…</div>
      }
    >
      <ReviewsAdminPage />
    </Suspense>
  )
}
