"use client"

import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { Eye, MoreVertical } from "lucide-react"
import type { AdminEnterpriseListItem } from "@/types/admin-api.types"
import {
  getActionMenuPosition,
  getEnterpriseRowKind,
} from "@/components/admin/enterprises/list/utils"
import type { EnterpriseListActionMenu } from "@/hooks/admin-hooks"
import { Pagination } from "@/components/ui/pagination"

type SetQuery = (next: {
  status?: "all" | "active" | "locked" | "pending"
  search?: string
  page?: number
  limit?: number
}) => void

type Props = {
  loading: boolean
  error: string | null
  visibleRows: AdminEnterpriseListItem[]
  totalRows: number
  safePage: number
  limit: number
  setQuery: SetQuery
  setActionMenu: React.Dispatch<React.SetStateAction<EnterpriseListActionMenu | null>>
}

export function EnterpriseListTableSection({
  loading,
  error,
  visibleRows,
  totalRows,
  safePage,
  limit,
  setQuery,
  setActionMenu,
}: Props) {
  return (
    <>
      {error && (
        <div className="rounded-lg bg-rose-50 text-rose-800 text-sm px-3 py-2">{error}</div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Loading…</div>
          ) : (
            <table className="min-w-full text-[12px] leading-4">
              <thead>
                <tr className="bg-[#f9fbfc] text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 pl-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Enterprise ID
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Enterprise Name
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Email
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Status
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Phone
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Joined
                  </th>
                  <th className="py-2 pr-4 text-right w-40 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((e) => (
                  <tr key={e.EnterpriseID}>
                    <td className="py-2 pr-4 pl-4 text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                      {String(e.EnterpriseID).slice(0, 8)}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="text-[12px] leading-4 font-medium text-blue-600 hover:underline cursor-default">
                        {e.EnterpriseName}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                      {e.account.Email}
                    </td>
                    <td className="py-2 pr-4">
                      {e.account.Status === "Active" ? (
                        <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                          Active
                        </span>
                      ) : e.hasPendingInvitation ? (
                        <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          Pending
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 capitalize">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-700">{e.PhoneNumber}</td>
                    <td className="py-2 pr-4 text-slate-700">
                      {formatDate(String(e.CreatedAt)).split(",")[0]}
                    </td>
                    <td className="py-2 pr-4 text-right w-40">
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/admin/enterprises/${encodeURIComponent(e.EnterpriseID)}`}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs leading-4 font-medium text-[#2563FF] hover:bg-blue-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>

                        <div className="relative inline-flex justify-end">
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              const btn = ev.currentTarget
                              const { left, top } = getActionMenuPosition(btn)
                              const rowKind = getEnterpriseRowKind(e)
                              setActionMenu((cur) =>
                                cur?.enterpriseId === e.EnterpriseID
                                  ? null
                                  : {
                                      enterpriseId: e.EnterpriseID,
                                      accountId: e.account.AccountID,
                                      enterpriseName: e.EnterpriseName,
                                      rowKind,
                                      left,
                                      top,
                                    },
                              )
                            }}
                            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition"
                            aria-label="Actions"
                            data-action-menu-trigger="true"
                          >
                            <MoreVertical className="w-4 h-4 text-slate-700" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && totalRows === 0 && (
            <div className="text-center text-slate-500 py-10">No enterprises</div>
          )}
        </div>

        {!loading && totalRows > 0 && (
          <Pagination
            page={safePage}
            pageSize={limit}
            total={totalRows}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={(p) => setQuery({ page: p })}
            onPageSizeChange={(n) => setQuery({ limit: n, page: 1 })}
          />
        )}
      </div>
    </>
  )
}
