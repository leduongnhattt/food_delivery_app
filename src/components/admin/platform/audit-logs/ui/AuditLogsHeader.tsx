"use client"

import { Download, RefreshCw } from "lucide-react"
import { mergeClasses } from "@/lib/utils"

export function AuditLogsHeader({
  onRefresh,
  onExport,
}: {
  onRefresh: () => void
  onExport: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-base font-bold tracking-tight text-slate-900">Audit Logs</h1>
        <p className="mt-0.5 text-xs leading-snug text-slate-600">
          View and filter system audit logs for Create, Update, and Delete actions across the platform.
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className={mergeClasses(
            "inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-normal text-slate-700 shadow-sm",
            "hover:bg-slate-50 active:bg-slate-100 transition-colors",
          )}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
        <button
          type="button"
          onClick={onExport}
          className={mergeClasses(
            "inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-2.5 text-xs font-medium text-white shadow-sm",
            "hover:bg-blue-700 active:bg-blue-800 transition-colors",
          )}
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>
    </div>
  )
}

