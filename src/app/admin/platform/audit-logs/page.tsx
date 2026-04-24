import { Suspense } from "react"
import AuditLogsPage from "@/components/admin/platform/audit-logs/AuditLogsPage"

export default function AdminAuditLogsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <AuditLogsPage />
    </Suspense>
  )
}
