"use client"

import SuspendEnterpriseConfirmModal from "@/components/admin/enterprises/modals/SuspendEnterpriseConfirmModal"
import DeleteEnterpriseConfirmModal from "@/components/admin/enterprises/modals/DeleteEnterpriseConfirmModal"
import ApproveEnterpriseConfirmModal from "@/components/admin/enterprises/modals/ApproveEnterpriseConfirmModal"
import ActivateEnterpriseConfirmModal from "@/components/admin/enterprises/modals/ActivateEnterpriseConfirmModal"

type Props = {
  suspendModal: { accountId: string; enterpriseName: string } | null
  setSuspendModal: (v: { accountId: string; enterpriseName: string } | null) => void
  deleteModal: { enterpriseId: string; enterpriseName: string } | null
  setDeleteModal: (v: { enterpriseId: string; enterpriseName: string } | null) => void
  unlockModal: {
    mode: "approve" | "activate"
    accountId: string
    enterpriseName: string
  } | null
  setUnlockModal: (
    v: { mode: "approve" | "activate"; accountId: string; enterpriseName: string } | null,
  ) => void
  pendingAccountId: string | null
  pendingDeleteEnterpriseId: string | null
  onConfirmSuspend: () => void | Promise<void>
  onConfirmDelete: () => void | Promise<void>
  onConfirmUnlock: () => void | Promise<void>
}

export function EnterpriseListModalsGroup({
  suspendModal,
  setSuspendModal,
  deleteModal,
  setDeleteModal,
  unlockModal,
  setUnlockModal,
  pendingAccountId,
  pendingDeleteEnterpriseId,
  onConfirmSuspend,
  onConfirmDelete,
  onConfirmUnlock,
}: Props) {
  return (
    <>
      <SuspendEnterpriseConfirmModal
        open={!!suspendModal}
        enterpriseName={suspendModal?.enterpriseName ?? ""}
        onClose={() => setSuspendModal(null)}
        onConfirm={onConfirmSuspend}
        isSubmitting={!!suspendModal && pendingAccountId === suspendModal.accountId}
      />

      <DeleteEnterpriseConfirmModal
        open={!!deleteModal}
        enterpriseName={deleteModal?.enterpriseName ?? ""}
        onClose={() => setDeleteModal(null)}
        onConfirm={onConfirmDelete}
        isSubmitting={
          !!deleteModal && pendingDeleteEnterpriseId === deleteModal.enterpriseId
        }
      />

      <ApproveEnterpriseConfirmModal
        open={unlockModal?.mode === "approve"}
        enterpriseName={unlockModal?.enterpriseName ?? ""}
        onClose={() => setUnlockModal(null)}
        onConfirm={onConfirmUnlock}
        isSubmitting={
          !!unlockModal &&
          unlockModal.mode === "approve" &&
          pendingAccountId === unlockModal.accountId
        }
      />
      <ActivateEnterpriseConfirmModal
        open={unlockModal?.mode === "activate"}
        enterpriseName={unlockModal?.enterpriseName ?? ""}
        onClose={() => setUnlockModal(null)}
        onConfirm={onConfirmUnlock}
        isSubmitting={
          !!unlockModal &&
          unlockModal.mode === "activate" &&
          pendingAccountId === unlockModal.accountId
        }
      />
    </>
  )
}
