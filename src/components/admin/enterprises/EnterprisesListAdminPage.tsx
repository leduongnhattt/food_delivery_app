"use client"

import { useEnterpriseListPage } from "@/hooks/use-enterprise-list-page"
import { EnterpriseListFloatingActionMenu } from "./EnterpriseListFloatingActionMenu"
import { EnterpriseListModalsGroup } from "./EnterpriseListModalsGroup"
import { EnterpriseListSearchFilter } from "./EnterpriseListSearchFilter"
import { EnterpriseListStatsCards } from "./EnterpriseListStatsCards"
import { EnterpriseListTableSection } from "./EnterpriseListTableSection"

export default function EnterprisesListAdminPage() {
  const ctx = useEnterpriseListPage()

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
            Enterprise List
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            View and manage all enterprises on the platform.
          </p>
        </div>

        <EnterpriseListSearchFilter
          searchInput={ctx.searchInput}
          onSearchChange={ctx.onSearchChange}
          tab={ctx.tab}
          openStatusMenu={ctx.openStatusMenu}
          setOpenStatusMenu={ctx.setOpenStatusMenu}
          statusMenuRef={ctx.statusMenuRef}
          setQuery={ctx.setQuery}
        />

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
          The Pending filter lists enterprises with an inactive account and at least one pending invitation
          (awaiting activation). The Pending stat card is the total pending invitations across the platform.
        </div>

        <EnterpriseListStatsCards stats={ctx.stats} />

        <EnterpriseListTableSection
          loading={ctx.loading}
          error={ctx.error}
          visibleRows={ctx.visibleRows}
          totalRows={ctx.totalRows}
          pageStart={ctx.pageStart}
          pageEnd={ctx.pageEnd}
          safePage={ctx.safePage}
          totalPages={ctx.totalPages}
          limit={ctx.limit}
          openLimitMenu={ctx.openLimitMenu}
          setOpenLimitMenu={ctx.setOpenLimitMenu}
          limitMenuRef={ctx.limitMenuRef}
          setQuery={ctx.setQuery}
          setActionMenu={ctx.setActionMenu}
        />

        <EnterpriseListFloatingActionMenu
          router={ctx.router}
          actionMenu={ctx.actionMenu}
          actionMenuElRef={ctx.actionMenuElRef}
          setActionMenu={ctx.setActionMenu}
          setSuspendModal={ctx.setSuspendModal}
          setUnlockModal={ctx.setUnlockModal}
          setDeleteModal={ctx.setDeleteModal}
          pendingAccountId={ctx.pendingAccountId}
          pendingDeleteEnterpriseId={ctx.pendingDeleteEnterpriseId}
        />

        <EnterpriseListModalsGroup
          suspendModal={ctx.suspendModal}
          setSuspendModal={ctx.setSuspendModal}
          deleteModal={ctx.deleteModal}
          setDeleteModal={ctx.setDeleteModal}
          unlockModal={ctx.unlockModal}
          setUnlockModal={ctx.setUnlockModal}
          pendingAccountId={ctx.pendingAccountId}
          pendingDeleteEnterpriseId={ctx.pendingDeleteEnterpriseId}
          onConfirmSuspend={ctx.confirmSuspendEnterprise}
          onConfirmDelete={ctx.confirmDeleteEnterprise}
          onConfirmUnlock={ctx.confirmUnlockEnterprise}
        />
      </div>
    </div>
  )
}
