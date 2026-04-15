import { Suspense } from "react"
import ReviewsAdminPage from "@/components/admin/reviews/ReviewsAdminPage"

export default function AdminReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-[13px] leading-4 font-normal">
          Loading…
        </div>
      }
    >
      <ReviewsAdminPage />
    </Suspense>
  )
}
