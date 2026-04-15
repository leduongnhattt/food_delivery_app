"use client"

import { useParams } from "next/navigation"
import EnterpriseInvitationDetailAdminPage from "@/components/admin/enterprises/EnterpriseInvitationDetailAdminPage"

export default function AdminEnterpriseInvitationDetailRoutePage() {
  const params = useParams()
  const invitationId = typeof params?.invitationId === "string" ? params.invitationId : ""
  if (!invitationId) {
    return (
      <div className="py-16 text-center text-[13px] leading-4 text-slate-500">Invalid invitation.</div>
    )
  }
  return <EnterpriseInvitationDetailAdminPage invitationId={invitationId} />
}
