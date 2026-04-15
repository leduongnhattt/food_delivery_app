import { Suspense } from "react"
import EnterprisesInvitationsAdminPage from "@/components/admin/enterprises/EnterprisesInvitationsAdminPage"

export default function AdminEnterprisesInvitationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <EnterprisesInvitationsAdminPage />
    </Suspense>
  )
}

