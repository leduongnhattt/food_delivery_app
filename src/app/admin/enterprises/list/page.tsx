import { Suspense } from "react"
import EnterprisesListAdminPage from "@/components/admin/enterprises/list/EnterprisesListAdminPage"

export default function AdminEnterprisesListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <EnterprisesListAdminPage />
    </Suspense>
  )
}

