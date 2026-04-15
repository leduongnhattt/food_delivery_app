import { Suspense } from "react"
import AdminSupportList from "@/components/admin/support/AdminSupportList"

export default function AdminSupportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20 text-slate-500">Loading…</div>
      }
    >
      <AdminSupportList />
    </Suspense>
  )
}
