"use client"

import { useParams } from "next/navigation"
import EnterpriseDetailAdminPage from "@/components/admin/enterprises/EnterpriseDetailAdminPage"

export default function AdminEnterpriseDetailRoutePage() {
  const params = useParams()
  const enterpriseId = typeof params?.enterpriseId === "string" ? params.enterpriseId : ""
  if (!enterpriseId) {
    return (
      <div className="py-16 text-center text-[13px] leading-4 text-slate-500">
        Invalid enterprise.
      </div>
    )
  }
  return <EnterpriseDetailAdminPage enterpriseId={enterpriseId} />
}
