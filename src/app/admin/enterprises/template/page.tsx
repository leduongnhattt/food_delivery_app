import { Suspense } from "react"
import EnterprisesInvitationTemplateAdminPage from "@/components/admin/enterprises/EnterprisesInvitationTemplateAdminPage"

export default function AdminEnterprisesInvitationTemplatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <EnterprisesInvitationTemplateAdminPage />
    </Suspense>
  )
}

