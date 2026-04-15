"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import type { EnterpriseListActionMenu } from "@/hooks/use-enterprise-list-page"

type Props = {
  router: AppRouterInstance
  actionMenu: EnterpriseListActionMenu | null
  actionMenuElRef: React.RefObject<HTMLDivElement | null>
  setActionMenu: React.Dispatch<React.SetStateAction<EnterpriseListActionMenu | null>>
  setSuspendModal: (v: { accountId: string; enterpriseName: string } | null) => void
  setUnlockModal: (
    v: { mode: "approve" | "activate"; accountId: string; enterpriseName: string } | null,
  ) => void
  setDeleteModal: (v: { enterpriseId: string; enterpriseName: string } | null) => void
  pendingAccountId: string | null
  pendingDeleteEnterpriseId: string | null
}

export function EnterpriseListFloatingActionMenu({
  router,
  actionMenu,
  actionMenuElRef,
  setActionMenu,
  setSuspendModal,
  setUnlockModal,
  setDeleteModal,
  pendingAccountId,
  pendingDeleteEnterpriseId,
}: Props) {
  if (!actionMenu) return null

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
        onClick={() => {
          void router.push(`/admin/enterprises/${encodeURIComponent(actionMenu.enterpriseId)}/edit`)
          setActionMenu(null)
        }}
      >
        Edit
      </button>

      {actionMenu.rowKind === "active" && (
        <button
          type="button"
          disabled={pendingAccountId === actionMenu.accountId}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const { accountId, enterpriseName } = actionMenu
            setActionMenu(null)
            window.setTimeout(() => {
              setSuspendModal({ accountId, enterpriseName })
            }, 0)
          }}
          className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 disabled:opacity-60"
        >
          Suspend
        </button>
      )}
      {actionMenu.rowKind === "approve" && (
        <button
          type="button"
          disabled={pendingAccountId === actionMenu.accountId}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const { accountId, enterpriseName } = actionMenu
            setActionMenu(null)
            window.setTimeout(() => {
              setUnlockModal({ mode: "approve", accountId, enterpriseName })
            }, 0)
          }}
          className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 disabled:opacity-60"
        >
          Approve
        </button>
      )}
      {actionMenu.rowKind === "activate" && (
        <button
          type="button"
          disabled={pendingAccountId === actionMenu.accountId}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            const { accountId, enterpriseName } = actionMenu
            setActionMenu(null)
            window.setTimeout(() => {
              setUnlockModal({ mode: "activate", accountId, enterpriseName })
            }, 0)
          }}
          className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 disabled:opacity-60"
        >
          Activate
        </button>
      )}

      <button
        type="button"
        disabled={pendingDeleteEnterpriseId === actionMenu.enterpriseId}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const { enterpriseId, enterpriseName } = actionMenu
          setActionMenu(null)
          window.setTimeout(() => {
            setDeleteModal({ enterpriseId, enterpriseName })
          }, 0)
        }}
        className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-rose-600 hover:bg-slate-50 disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  )
}
