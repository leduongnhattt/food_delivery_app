"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

type Props = {
  open: boolean
  enterpriseName: string
  onClose: () => void
  onConfirm: () => void | Promise<void>
  isSubmitting: boolean
}

/**
 * Confirm soft-delete for an enterprise (admin list ⋮, detail header).
 * Backend sets `DeletedAt` and deactivates account; rows are not hard-deleted.
 */
export default function DeleteEnterpriseConfirmModal({
  open,
  enterpriseName,
  onClose,
  onConfirm,
  isSubmitting,
}: Props) {
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  if (!portalReady || !open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-enterprise-title"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h2 id="delete-enterprise-title" className="text-[16px] font-semibold text-slate-900">
            Delete Enterprise
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-4">
          <p className="text-[13px] leading-relaxed text-slate-600">
            Are you sure you want to delete{" "}
            <span className="font-medium text-slate-800">{enterpriseName}</span>? The storefront and
            products will be hidden from the platform and the account will be deactivated. Records are
            kept in the database (soft delete); this is not a permanent erase of all data.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-4 text-[13px] font-semibold text-slate-800 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => {
              e.stopPropagation()
              void onConfirm()
            }}
            className="inline-flex h-9 items-center rounded-lg bg-red-600 px-4 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isSubmitting ? "Deleting…" : "Delete Enterprise"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
