import { Suspense } from "react"
import AdminSupportDetail from "@/components/admin/support/AdminSupportDetail"

export default function AdminSupportTicketPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-slate-500">Loading…</div>
      }
    >
      <AdminSupportDetail />
    </Suspense>
  )
}
