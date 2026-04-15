import type { AdminEnterpriseListItem } from "@/types/admin-api.types"

export type EnterpriseListTab = "all" | "active" | "locked" | "pending"

export const ENTERPRISE_LIST_PATH = "/admin/enterprises/list"

export function parseEnterpriseListTab(statusRaw: string | null): EnterpriseListTab {
  if (statusRaw === "active" || statusRaw === "locked" || statusRaw === "pending") return statusRaw
  return "all"
}

/** Invitation-only query values that must not stay on the list URL. */
export function shouldStripListStatus(statusRaw: string | null): boolean {
  if (statusRaw == null || statusRaw === "") return false
  return !["all", "active", "locked", "pending"].includes(statusRaw)
}

export type EnterpriseRowKind = "active" | "approve" | "activate"

export function getEnterpriseRowKind(e: AdminEnterpriseListItem): EnterpriseRowKind {
  if (e.account.Status === "Active") return "active"
  if (e.hasPendingInvitation) return "approve"
  return "activate"
}

export function getActionMenuPosition(buttonEl: HTMLButtonElement): { left: number; top: number } {
  const rect = buttonEl.getBoundingClientRect()
  const MENU_W = 160
  const pad = 8
  const left = Math.min(window.innerWidth - pad - MENU_W, Math.max(pad, rect.right - MENU_W))
  const top = rect.bottom + 8
  return { left, top }
}

export function enterpriseListStatusLabel(tab: EnterpriseListTab): string {
  if (tab === "active") return "Active"
  if (tab === "locked") return "Suspended"
  if (tab === "pending") return "Pending"
  return "All Status"
}
