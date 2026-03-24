import { Suspense } from "react"
import EnterprisesAdminPage from "@/components/admin/EnterprisesAdminPage"

export default function AdminEnterprisesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500">Loading…</div>
      }
    >
      <EnterprisesAdminPage />
    </Suspense>
  )
}
