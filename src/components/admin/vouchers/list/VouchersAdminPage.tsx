"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { AdminVoucherListItem } from "@/types/admin-api.types"
import { approveAdminVoucher, listAdminVouchers, rejectAdminVoucher } from "@/services/admin.service"
import { useToast } from "@/contexts/toast-context"
import { VouchersFiltersCard } from "@/components/admin/vouchers/list/VouchersFiltersCard"
import { VouchersTableCard } from "@/components/admin/vouchers/list/VouchersTableCard"
import { VouchersFloatingActionMenu } from "@/components/admin/vouchers/list/VouchersFloatingActionMenu"
import type { CreatedRangeFilter, StatusFilter, VoucherActionMenu } from "@/components/admin/vouchers/list/utils"

export default function VouchersAdminPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = (searchParams.get("status") || "all") as StatusFilter
  const q = (searchParams.get("q") || "").trim()
  const createdRange = (searchParams.get("range") || "all") as CreatedRangeFilter
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1)
  const limit = Math.min(200, Math.max(5, Number(searchParams.get("limit") || "12") || 12))

  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<AdminVoucherListItem[]>([])
  const [total, setTotal] = useState(0)
  const [pendingApproveId, setPendingApproveId] = useState<string | null>(null)
  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [openRangeMenu, setOpenRangeMenu] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)
  const rangeMenuRef = useRef<HTMLDivElement | null>(null)
  const [actionMenu, setActionMenu] = useState<VoucherActionMenu>(null)
  const actionMenuElRef = useRef<HTMLDivElement | null>(null)

  const queryKey = useMemo(
    () => `${status}::${q}::${createdRange}::${page}::${limit}`,
    [status, q, createdRange, page, limit],
  )

  async function load() {
    setLoading(true)
    try {
      const res = await listAdminVouchers({
        status,
        q,
        page,
        limit,
        range: createdRange === "all" ? undefined : createdRange,
      })
      setVouchers(res.items || [])
      setTotal(res.total || 0)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load vouchers"
      showToast(message, "error", 4000)
      setVouchers([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  async function onApprove(voucherId: string) {
    setPendingApproveId(voucherId)
    try {
      await approveAdminVoucher(voucherId)
      showToast("Voucher approved", "success", 2500)
      await load()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to approve voucher"
      showToast(message, "error", 4000)
    } finally {
      setPendingApproveId(null)
    }
  }

  async function onReject(voucherId: string) {
    setPendingRejectId(voucherId)
    try {
      await rejectAdminVoucher(voucherId)
      showToast("Voucher updated", "success", 2500)
      await load()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update voucher"
      showToast(message, "error", 4000)
    } finally {
      setPendingRejectId(null)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const target = ev.target as HTMLElement | null

      if (actionMenu) {
        const insideMenu =
          !!actionMenuElRef.current && !!target && actionMenuElRef.current.contains(target)
        const insideTrigger = !!target?.closest?.('[data-action-menu-trigger="true"]')
        if (!insideMenu && !insideTrigger) setActionMenu(null)
      }

      if (openStatusMenu && statusMenuRef.current && target) {
        if (!statusMenuRef.current.contains(target)) setOpenStatusMenu(false)
      }
      if (openRangeMenu && rangeMenuRef.current && target) {
        if (!rangeMenuRef.current.contains(target)) setOpenRangeMenu(false)
      }
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [openStatusMenu, openRangeMenu, actionMenu])

  const statusLabel = useMemo(() => {
    if (status === "pending") return "Pending"
    if (status === "approved") return "Approved"
    if (status === "rejected") return "Rejected"
    if (status === "expired") return "Expired"
    return "All Status"
  }, [status])

  const rangeLabel = useMemo(() => {
    if (createdRange === "7d") return "Last 7 days"
    if (createdRange === "30d") return "Last 30 days"
    if (createdRange === "90d") return "Last 90 days"
    return "All time"
  }, [createdRange])

  const visibleVouchers = vouchers

  function setQueryParam(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k)
      else next.set(k, v)
    }
    router.replace(`/admin/vouchers?${next.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[14px] leading-[18px] font-semibold text-[oklch(0.21_0.034_264.665)]">
              Vouchers
            </h1>
            <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
              Approve pending vouchers from enterprises
            </p>
          </div>
        </div>

        <VouchersFiltersCard
          status={status}
          statusLabel={statusLabel}
          openStatusMenu={openStatusMenu}
          setOpenStatusMenu={setOpenStatusMenu}
          statusMenuRef={statusMenuRef}
          onSelectStatus={(nextStatus) => setQueryParam({ status: nextStatus, page: "1" })}
          createdRange={createdRange}
          rangeLabel={rangeLabel}
          openRangeMenu={openRangeMenu}
          setOpenRangeMenu={setOpenRangeMenu}
          rangeMenuRef={rangeMenuRef}
          onSelectRange={(nextRange) => setQueryParam({ range: nextRange === "all" ? null : nextRange, page: "1" })}
          searchQuery={q}
          visibleCount={visibleVouchers.length}
          onOpenCreate={() => router.push("/admin/vouchers/new")}
        />
      </div>

      <VouchersTableCard
        loading={loading}
        visibleVouchers={visibleVouchers}
        pendingApproveId={pendingApproveId}
        pendingRejectId={pendingRejectId}
        onOpenActionMenu={({ voucherId, voucherStatus, left, top }) =>
          setActionMenu((cur) => (cur?.voucherId === voucherId ? null : { voucherId, voucherStatus, left, top }))
        }
        pagination={{
          page,
          pageSize: limit,
          total,
          pageSizeOptions: [12, 20, 50],
          onPageChange: (p) => setQueryParam({ page: String(p) }),
          onPageSizeChange: (n) => setQueryParam({ limit: String(n), page: "1" }),
        }}
      />

      <VouchersFloatingActionMenu
        router={router}
        actionMenu={actionMenu}
        actionMenuElRef={actionMenuElRef}
        pendingApproveId={pendingApproveId}
        pendingRejectId={pendingRejectId}
        onClose={() => setActionMenu(null)}
        onApprove={(voucherId) => void onApprove(voucherId)}
        onReject={(voucherId) => void onReject(voucherId)}
      />
    </div>
  )
}

