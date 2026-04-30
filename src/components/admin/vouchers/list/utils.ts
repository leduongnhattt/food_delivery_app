"use client"

export type StatusFilter = "pending" | "approved" | "rejected" | "expired" | "all"
export type CreatedRangeFilter = "all" | "7d" | "30d" | "90d"

export type VoucherActionMenu =
  | {
      voucherId: string
      voucherStatus: string
      left: number
      top: number
    }
  | null

export function getActionMenuPosition(buttonEl: HTMLButtonElement): { left: number; top: number } {
  const rect = buttonEl.getBoundingClientRect()
  const MENU_W = 160
  const pad = 8
  const left = Math.min(window.innerWidth - pad - MENU_W, Math.max(pad, rect.right - MENU_W))
  const top = rect.bottom + 8
  return { left, top }
}

