"use client"

import { Pagination } from "@/components/ui/pagination"
import { formatDate } from "@/lib/utils"
import type { AuditLogRow } from "@/components/admin/platform/audit-logs/types"
import { StatusPill } from "@/components/admin/platform/audit-logs/ui/StatusPill"
import { PAGE_SIZE_OPTIONS } from "@/components/admin/platform/audit-logs/constants"
import { ArrowUpDown } from "lucide-react"

export function AuditLogsTableCard({
  rows,
  total,
  page,
  setPage,
  pageSize,
  setPageSize,
  order,
  onToggleOrder,
}: {
  rows: AuditLogRow[]
  total: number
  page: number
  setPage: (p: number) => void
  pageSize: (typeof PAGE_SIZE_OPTIONS)[number]
  setPageSize: (n: (typeof PAGE_SIZE_OPTIONS)[number]) => void
  order: "asc" | "desc"
  onToggleOrder: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full min-w-0 overflow-x-hidden">
        <table className="table-fixed w-full border-t border-slate-200 text-[11px] leading-[1.55] sm:text-[12px] sm:leading-[1.6]">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[14%]" />
            <col className="w-[7%]" />
            <col className="w-[11%]" />
            <col className="w-[8%]" />
            <col className="w-[9%]" />
            <col className="w-[28%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50 text-left border-b border-slate-200">
              <th className="py-2 pr-2 pl-4 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                <button
                  type="button"
                  onClick={onToggleOrder}
                  className="inline-flex items-center gap-1 hover:opacity-80"
                  aria-label="Sort by Timestamp"
                >
                  Timestamp
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                  <span className="sr-only">{order}</span>
                </button>
              </th>
              <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                User
              </th>
              <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                Role
              </th>
              <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                Module
              </th>
              <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                Action
              </th>
              <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                Status
              </th>
              <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                Description
              </th>
              <th className="py-2 pr-4 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                IP Address
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  No logs found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="bg-white hover:bg-slate-50/70">
                  <td className="min-w-0 py-2 pr-2 pl-4 align-top text-slate-700 break-words whitespace-normal">
                    {formatDate(r.timestamp)}
                  </td>
                  <td className="min-w-0 py-2 pr-2 align-top font-medium text-[oklch(0.21_0.034_264.665)] break-all">
                    {r.user}
                  </td>
                  <td className="min-w-0 py-2 pr-2 align-top text-slate-700 break-words">{r.role}</td>
                  <td className="min-w-0 py-2 pr-2 align-top text-slate-700 break-all">{r.module}</td>
                  <td className="min-w-0 py-2 pr-2 align-top font-medium text-[oklch(0.21_0.034_264.665)] break-words">
                    {r.action}
                  </td>
                  <td className="min-w-0 py-2 pr-2 align-top">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="min-w-0 py-2 pr-2 align-top text-slate-700 break-words">{r.description}</td>
                  <td className="min-w-0 py-2 pr-4 align-top font-mono text-slate-700 break-all">
                    {r.ipAddress}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={(nextPage) => setPage(nextPage)}
        pageSizeOptions={[12, 20, 50]}
        onPageSizeChange={(n) => {
          setPageSize(n as (typeof PAGE_SIZE_OPTIONS)[number])
          setPage(1)
        }}
      />
    </div>
  )
}

