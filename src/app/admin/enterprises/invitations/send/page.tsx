import { Suspense } from "react"
import SendEnterpriseInvitationAdminPage from "@/components/admin/enterprises/invitations/SendEnterpriseInvitationAdminPage"

export default function AdminEnterprisesInvitationsSendPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <SendEnterpriseInvitationAdminPage />
    </Suspense>
  )
}

