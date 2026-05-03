"use client"

import type { AdminVoucherListItem } from "@/types/admin-api.types"
import { MoreVertical } from "lucide-react"
import { getActionMenuPosition } from "@/components/admin/vouchers/list/utils"
import { Pagination } from "@/components/ui/pagination"

export function VouchersTableCard({
  loading,
  visibleVouchers,
  pendingApproveId,
  pendingRejectId,
  onOpenActionMenu,
  pagination,
}: {
  loading: boolean
  visibleVouchers: AdminVoucherListItem[]
  pendingApproveId: string | null
  pendingRejectId: string | null
  onOpenActionMenu: (args: { voucherId: string; voucherStatus: string; left: number; top: number }) => void
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (nextPage: number) => void
    onPageSizeChange: (nextSize: number) => void
    pageSizeOptions?: readonly number[]
  }
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-[13px]">
          <thead>
            <tr className="bg-[#f9fbfc] text-left text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-4 pl-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                Voucher Code
              </th>
              <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                Created By
              </th>
              <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                Discount Percent
              </th>
              <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                Discount Amount
              </th>
              <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                Usage Count
              </th>
              <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                Created At
              </th>
              <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                Expiry Date
              </th>
              <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                Status
              </th>
              <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center text-slate-500 text-[13px] leading-4 font-normal py-10">
                  Loading…
                </td>
              </tr>
            ) : visibleVouchers.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-slate-500 text-[13px] leading-4 font-normal py-10">
                  No vouchers found
                </td>
              </tr>
            ) : (
              visibleVouchers.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-2 pr-4 pl-4 text-[13px] leading-4 font-medium text-slate-900">{v.code}</td>
                  <td className="py-2 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                    {v.createdByLabel || v.enterpriseName || "—"}
                  </td>
                  <td className="py-2 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                    {v.discountPercent != null ? `${v.discountPercent}%` : "N/A"}
                  </td>
                  <td className="py-2 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                    {v.discountAmount != null ? `$${v.discountAmount}` : "N/A"}
                  </td>
                  <td className="py-2 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {v.usedCount || 0} / {v.maxUsage ?? "∞"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                    {v.createdAt ? new Date(v.createdAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="py-2 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                    {v.expiryDate ? new Date(v.expiryDate).toLocaleDateString("vi-VN") : "N/A"}
                  </td>
                  <td className="py-2 pr-4">
                    {v.status === "Approved" ? (
                      <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Approved
                      </span>
                    ) : v.status === "Rejected" ? (
                      <span className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        Rejected
                      </span>
                    ) : v.status === "Expired" ? (
                      <span className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-700 border border-slate-200">
                        Expired
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center">
                      <div className="relative inline-flex justify-end">
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation()
                            const btn = ev.currentTarget
                            const { left, top } = getActionMenuPosition(btn)
                            onOpenActionMenu({ voucherId: v.id, voucherStatus: v.status, left, top })
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                          aria-label="Actions"
                          data-action-menu-trigger="true"
                          disabled={pendingApproveId === v.id || pendingRejectId === v.id}
                        >
                          <MoreVertical className="w-4 h-4 text-slate-700" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && pagination && pagination.total > 0 ? (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      ) : null}
    </div>
  )
}

