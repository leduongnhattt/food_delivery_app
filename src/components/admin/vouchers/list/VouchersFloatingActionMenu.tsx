"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import type { VoucherActionMenu } from "@/components/admin/vouchers/list/utils"

export function VouchersFloatingActionMenu({
  router,
  actionMenu,
  actionMenuElRef,
  pendingApproveId,
  pendingRejectId,
  onClose,
  onApprove,
  onReject,
}: {
  router: AppRouterInstance
  actionMenu: VoucherActionMenu
  actionMenuElRef: React.RefObject<HTMLDivElement | null>
  pendingApproveId: string | null
  pendingRejectId: string | null
  onClose: () => void
  onApprove: (voucherId: string) => void
  onReject: (voucherId: string) => void
}) {
  if (!actionMenu) return null

  const voucherId = actionMenu.voucherId
  const voucherStatus = actionMenu.voucherStatus

  return (
    <div
      ref={actionMenuElRef}
      style={{ left: actionMenu.left, top: actionMenu.top }}
      className="fixed z-[60] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
      onClick={(ev) => ev.stopPropagation()}
    >
      <button
        type="button"
        className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 text-left"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onClose()
          void router.push(`/admin/vouchers/${encodeURIComponent(voucherId)}`)
        }}
      >
        View
      </button>

      {voucherStatus === "Pending" && (
        <>
          <button
            type="button"
            disabled={pendingApproveId === voucherId}
            className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 disabled:opacity-60 text-left"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
              onApprove(voucherId)
            }}
          >
            Approve
          </button>
          <button
            type="button"
            disabled={pendingRejectId === voucherId}
            className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-rose-600 hover:bg-slate-50 disabled:opacity-60 text-left"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
              onReject(voucherId)
            }}
          >
            Reject
          </button>
        </>
      )}

      {voucherStatus === "Approved" && (
        <button
          type="button"
          disabled={pendingRejectId === voucherId}
          className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-rose-600 hover:bg-slate-50 disabled:opacity-60 text-left"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose()
            onReject(voucherId)
          }}
        >
          Disable
        </button>
      )}

      {voucherStatus === "Rejected" && (
        <button
          type="button"
          disabled={pendingApproveId === voucherId}
          className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 disabled:opacity-60 text-left"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose()
            onApprove(voucherId)
          }}
        >
          Approve
        </button>
      )}

      {/* For Expired (and other future statuses), keep only View action. */}
    </div>
  )
}

