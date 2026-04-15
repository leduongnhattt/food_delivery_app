"use client"

import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { Check, ChevronDown, Eye, MoreVertical } from "lucide-react"
import type { AdminEnterpriseListItem } from "@/types/admin-api.types"
import {
  getActionMenuPosition,
  getEnterpriseRowKind,
} from "@/components/admin/enterprises/enterprise-list-utils"
import type { EnterpriseListActionMenu } from "@/hooks/use-enterprise-list-page"

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
  pageStart: number
  pageEnd: number
  safePage: number
  totalPages: number
  limit: number
  openLimitMenu: boolean
  setOpenLimitMenu: (v: boolean | ((p: boolean) => boolean)) => void
  limitMenuRef: React.RefObject<HTMLDivElement | null>
  setQuery: SetQuery
  setActionMenu: React.Dispatch<React.SetStateAction<EnterpriseListActionMenu | null>>
}

export function EnterpriseListTableSection({
  loading,
  error,
  visibleRows,
  totalRows,
  pageStart,
  pageEnd,
  safePage,
  totalPages,
  limit,
  openLimitMenu,
  setOpenLimitMenu,
  limitMenuRef,
  setQuery,
  setActionMenu,
}: Props) {
  return (
    <>
      {error && (
        <div className="rounded-lg bg-rose-50 text-rose-800 text-sm px-3 py-2">{error}</div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto px-4">
          {loading ? (
            <div className="text-center text-slate-500 py-10">Loading…</div>
          ) : (
            <table className="min-w-full text-[12px] leading-4">
              <thead>
                <tr className="bg-[#f9fbfc] text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
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
                  <th className="py-2 pr-0 text-right w-40 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRows.map((e) => (
                  <tr key={e.EnterpriseID}>
                    <td className="py-2 pr-4 text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
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
                    <td className="py-2 pr-0 text-right w-40">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Showing <span className="font-medium text-slate-700">{pageEnd - pageStart}</span> of{" "}
              <span className="font-medium text-slate-700">{totalRows}</span> enterprises
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }).map((_, idx) => {
                  const n = idx + 1
                  const active = n === safePage
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuery({ page: n })}
                      className={`h-7 w-7 rounded border text-xs transition ${
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
                {totalPages > 7 && <span className="px-1 text-xs text-slate-500">…</span>}
              </div>

              <div ref={limitMenuRef} className="relative">
                <button
                  type="button"
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setOpenLimitMenu((v) => !v)
                  }}
                  className="relative inline-flex items-center justify-between h-7 min-w-14 rounded border border-slate-200 bg-white px-2 text-xs leading-4 text-slate-700 hover:bg-slate-50"
                  aria-label="Rows per page"
                >
                  <span>{limit}</span>
                  <ChevronDown
                    className={`w-3 h-3 ml-1 text-slate-500 transition-transform duration-150 ${
                      openLimitMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openLimitMenu && (
                  <div className="absolute right-0 mt-2 w-14 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg z-50 p-1">
                    {[5, 10, 20, 50].map((n) => {
                      const active = n === limit
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => {
                            setOpenLimitMenu(false)
                            setQuery({ limit: n, page: 1 })
                          }}
                          className={`w-full px-2 py-1.5 text-left text-[11px] leading-4 rounded-md transition ${
                            active
                              ? "bg-slate-100 text-slate-900"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            <span>{n}</span>
                            {active && <Check className="w-3.5 h-3.5 text-slate-700" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
