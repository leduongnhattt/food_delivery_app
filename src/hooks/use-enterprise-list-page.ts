"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAdminSearchInput } from "@/hooks/use-admin-search-input"
import { useRouter, useSearchParams } from "next/navigation"
import {
  listAdminEnterprises,
  lockAdminEnterpriseAccount,
  softDeleteAdminEnterprise,
  unlockAdminEnterpriseAccount,
  listAdminEnterpriseInvitations,
} from "@/services/admin.service"
import type { AdminEnterpriseListItem } from "@/types/admin-api.types"
import { useToast } from "@/contexts/toast-context"
import {
  ENTERPRISE_LIST_PATH,
  parseEnterpriseListTab,
  shouldStripListStatus,
  type EnterpriseListTab,
} from "@/components/admin/enterprises/enterprise-list-utils"

export type EnterpriseListActionMenu = {
  enterpriseId: string
  accountId: string
  enterpriseName: string
  rowKind: "active" | "approve" | "activate"
  left: number
  top: number
}

export function useEnterpriseListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const statusRaw = searchParams.get("status")
  const tab = parseEnterpriseListTab(statusRaw)
  const search = searchParams.get("search")?.trim() || ""
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1)
  const limit = Math.min(50, Math.max(5, Number(searchParams.get("limit") || "10") || 10))

  const [enterprises, setEnterprises] = useState<AdminEnterpriseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null)
  const [pendingInvitations, setPendingInvitations] = useState(0)

  const [actionMenu, setActionMenu] = useState<EnterpriseListActionMenu | null>(null)
  const actionMenuElRef = useRef<HTMLDivElement | null>(null)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)
  const [openLimitMenu, setOpenLimitMenu] = useState(false)
  const limitMenuRef = useRef<HTMLDivElement | null>(null)

  const [unlockModal, setUnlockModal] = useState<{
    mode: "approve" | "activate"
    accountId: string
    enterpriseName: string
  } | null>(null)
  const [suspendModal, setSuspendModal] = useState<{
    accountId: string
    enterpriseName: string
  } | null>(null)
  const [deleteModal, setDeleteModal] = useState<{
    enterpriseId: string
    enterpriseName: string
  } | null>(null)
  const [pendingDeleteEnterpriseId, setPendingDeleteEnterpriseId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [res, inv] = await Promise.all([
        listAdminEnterprises({ status: tab, search }),
        listAdminEnterpriseInvitations({ status: "pending" }),
      ])
      setEnterprises(res.items)
      setPendingInvitations(inv.items.length)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load enterprises")
      setEnterprises([])
      setPendingInvitations(0)
    } finally {
      setLoading(false)
    }
  }, [tab, search])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!shouldStripListStatus(statusRaw)) return
    const p = new URLSearchParams(searchParams.toString())
    p.delete("status")
    const qs = p.toString()
    router.replace(qs ? `${ENTERPRISE_LIST_PATH}?${qs}` : ENTERPRISE_LIST_PATH, { scroll: false })
  }, [statusRaw, searchParams, router])

  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const target = ev.target as HTMLElement | null

      if (actionMenu) {
        const insideMenu =
          !!actionMenuElRef.current && !!target && actionMenuElRef.current.contains(target)
        const insideActionButton = !!target?.closest?.('[data-action-menu-trigger="true"]')
        if (!insideMenu && !insideActionButton) setActionMenu(null)
      }

      if (openStatusMenu && statusMenuRef.current && target) {
        if (!statusMenuRef.current.contains(target)) setOpenStatusMenu(false)
        return
      }
      setOpenStatusMenu(false)

      if (openLimitMenu && limitMenuRef.current && target) {
        if (!limitMenuRef.current.contains(target)) setOpenLimitMenu(false)
        return
      }
      setOpenLimitMenu(false)
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [openStatusMenu, openLimitMenu, actionMenu])

  const setQuery = useCallback(
    (next: {
      status?: EnterpriseListTab
      search?: string
      page?: number
      limit?: number
    }) => {
      const p = new URLSearchParams()
      const s = (next.status ?? tab) || "all"
      const q = (next.search ?? search).trim()
      const nextPage = Math.max(1, Number(next.page ?? page) || 1)
      const nextLimit = Math.min(50, Math.max(5, Number(next.limit ?? limit) || 10))
      if (s && s !== "all") p.set("status", s)
      if (q) p.set("search", q)
      if (nextPage !== 1) p.set("page", String(nextPage))
      if (nextLimit !== 10) p.set("limit", String(nextLimit))
      const qs = p.toString()
      router.push(qs ? `${ENTERPRISE_LIST_PATH}?${qs}` : ENTERPRISE_LIST_PATH)
    },
    [tab, search, page, limit, router],
  )

  const { value: searchInput, onChange: onSearchChange } = useAdminSearchInput(search, (q) =>
    setQuery({ search: q, page: 1 }),
  )

  const confirmUnlockEnterprise = useCallback(async () => {
    if (!unlockModal) return
    setPendingAccountId(unlockModal.accountId)
    try {
      await unlockAdminEnterpriseAccount(unlockModal.accountId)
      showToast(
        unlockModal.mode === "approve" ? "Enterprise approved" : "Enterprise activated",
        "success",
        3000,
      )
      setUnlockModal(null)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Unlock failed", "error", 5000)
    } finally {
      setPendingAccountId(null)
    }
  }, [unlockModal, showToast, load])

  const confirmDeleteEnterprise = useCallback(async () => {
    if (!deleteModal) return
    setPendingDeleteEnterpriseId(deleteModal.enterpriseId)
    try {
      await softDeleteAdminEnterprise(deleteModal.enterpriseId)
      showToast("Enterprise removed (soft delete)", "success", 3000)
      setDeleteModal(null)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed", "error", 5000)
    } finally {
      setPendingDeleteEnterpriseId(null)
    }
  }, [deleteModal, showToast, load])

  const confirmSuspendEnterprise = useCallback(async () => {
    if (!suspendModal) return
    setPendingAccountId(suspendModal.accountId)
    try {
      await lockAdminEnterpriseAccount(suspendModal.accountId)
      showToast("Enterprise suspended", "success", 3000)
      setSuspendModal(null)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Suspend failed", "error", 5000)
    } finally {
      setPendingAccountId(null)
    }
  }, [suspendModal, showToast, load])

  const stats = useMemo(() => {
    const total = enterprises.length
    const active = enterprises.filter((e) => e.account.Status === "Active").length
    const suspended = enterprises.filter((e) => e.account.Status !== "Active").length
    return { total, active, pending: pendingInvitations, suspended }
  }, [enterprises, pendingInvitations])

  const totalRows = enterprises.length
  const totalPages = Math.max(1, Math.ceil(totalRows / limit))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * limit
  const pageEnd = Math.min(totalRows, pageStart + limit)
  const visibleRows = useMemo(
    () => enterprises.slice(pageStart, pageEnd),
    [enterprises, pageStart, pageEnd],
  )

  return {
    router,
    tab,
    search,
    page,
    limit,
    enterprises,
    loading,
    error,
    stats,
    totalRows,
    totalPages,
    safePage,
    pageStart,
    pageEnd,
    visibleRows,
    searchInput,
    onSearchChange,
    setQuery,
    load,
    openStatusMenu,
    setOpenStatusMenu,
    statusMenuRef,
    openLimitMenu,
    setOpenLimitMenu,
    limitMenuRef,
    actionMenu,
    setActionMenu,
    actionMenuElRef,
    unlockModal,
    setUnlockModal,
    suspendModal,
    setSuspendModal,
    deleteModal,
    setDeleteModal,
    pendingAccountId,
    pendingDeleteEnterpriseId,
    confirmUnlockEnterprise,
    confirmDeleteEnterprise,
    confirmSuspendEnterprise,
  }
}
