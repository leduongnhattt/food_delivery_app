"use client"

import { mergeClasses } from "@/lib/utils"
import type { AuditLogStatus } from "@/components/admin/platform/audit-logs/types"

export function StatusPill({ status }: { status: AuditLogStatus }) {
  const style =
    status === "Success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "Failed"
        ? "bg-rose-50 text-rose-700 ring-rose-100"
        : "bg-amber-50 text-amber-700 ring-amber-100"

  return (
    <span
      className={mergeClasses(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1",
        style,
      )}
    >
      {status}
    </span>
  )
}

