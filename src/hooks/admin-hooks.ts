"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/contexts/toast-context"
import type { AdminCustomerListItem, AdminEnterpriseListItem } from "@/types/admin-api.types"
import {
  listAdminCustomers,
  lockAdminCustomer,
  unlockAdminCustomer,
  listAdminEnterprises,
  listAdminEnterpriseInvitations,
  lockAdminEnterpriseAccount,
  softDeleteAdminEnterprise,
  unlockAdminEnterpriseAccount,
} from "@/services/admin.service"
import {
  ENTERPRISE_LIST_PATH,
  parseEnterpriseListTab,
  shouldStripListStatus,
  type EnterpriseListTab,
} from "@/components/admin/enterprises/list/utils"

const DEBOUNCE_MS = 350

/**
 * Search input synced to URL: updates after a short debounce while typing (no Enter required).
 */
export function useAdminSearchInput(searchFromUrl: string, onApply: (trimmed: string) => void) {
  const [value, setValue] = useState(searchFromUrl)
  const onApplyRef = useRef(onApply)
  onApplyRef.current = onApply
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setValue(searchFromUrl)
  }, [searchFromUrl])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setValue(v)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      onApplyRef.current(v.trim())
    }, DEBOUNCE_MS)
  }

  return { value, onChange }
}

const ADMIN_CUSTOMERS_PAGE_SIZE_OPTIONS = [12, 24, 48] as const
type AccountStatusFilter = "all" | "active" | "locked"
type CustomerSearchField = "name" | "email" | "phone"

export function useAdminCustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const statusFilter = (searchParams.get("status") || "all") as AccountStatusFilter
  const searchText = searchParams.get("search")?.trim() || ""
  const searchField = (searchParams.get("qMode") || "name") as CustomerSearchField
  const currentCursor = searchParams.get("cursor") || ""

  const limitParam = Number(searchParams.get("limit") || "") || 12
  const pageSize = (ADMIN_CUSTOMERS_PAGE_SIZE_OPTIONS.includes(limitParam as any)
    ? (limitParam as any)
    : 12) as (typeof ADMIN_CUSTOMERS_PAGE_SIZE_OPTIONS)[number]

  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null)

  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)

  const cursorHistoryKey = useMemo(() => {
    return ["adminCustomersCursorStack", statusFilter, searchText, searchField, String(pageSize)].join(
      "|",
    )
  }, [statusFilter, searchText, searchField, pageSize])

  const cursorHistory = useMemo(() => {
    try {
      const storedValue = sessionStorage.getItem(cursorHistoryKey)
      const parsedList = storedValue ? (JSON.parse(storedValue) as string[]) : []
      return Array.isArray(parsedList) ? parsedList.filter((v) => typeof v === "string") : []
    } catch {
      return []
    }
  }, [cursorHistoryKey])

  const pageIndex = cursorHistory.length + 1
  const totalPagesHint = nextCursor ? pageIndex + 1 : pageIndex

  const writeCursorHistory = useCallback(
    (next: string[]) => {
      try {
        sessionStorage.setItem(cursorHistoryKey, JSON.stringify(next))
      } catch {}
    },
    [cursorHistoryKey],
  )

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await listAdminCustomers({
        status: statusFilter,
        search: searchText,
        limit: pageSize,
        cursor: currentCursor || undefined,
      })
      setCustomers(response.items)
      setNextCursor(response.nextCursor ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers")
      setCustomers([])
      setNextCursor(null)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchText, pageSize, currentCursor])

  useEffect(() => {
    void fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    function onDocClick(ev: MouseEvent) {
      const target = ev.target as Node | null
      if (isStatusMenuOpen && statusMenuRef.current && target) {
        if (!statusMenuRef.current.contains(target)) setIsStatusMenuOpen(false)
      }
    }
    document.addEventListener("click", onDocClick)
    return () => document.removeEventListener("click", onDocClick)
  }, [isStatusMenuOpen])

  const buildQuery = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const params = new URLSearchParams()
      const mergedParams = {
        status: statusFilter,
        search: searchText,
        qMode: searchField,
        limit: String(pageSize),
        ...overrides,
      }
      for (const [paramName, paramValue] of Object.entries(mergedParams)) {
        if (!paramValue) continue
        if (paramName === "qMode" && paramValue === "name") continue
        if (paramValue !== "all") params.set(paramName, paramValue)
      }
      return params.toString()
    },
    [statusFilter, searchText, searchField, pageSize],
  )

  const navigateToCursor = useCallback(
    (nextCursorVal: string | null) => {
      const queryString = buildQuery({ cursor: nextCursorVal ?? undefined })
      router.push(queryString ? `/admin/customers?${queryString}` : "/admin/customers")
    },
    [router, buildQuery],
  )

  const goNextPage = useCallback(() => {
    if (!nextCursor) return
    const nextHistory = [...cursorHistory, currentCursor || ""]
    writeCursorHistory(nextHistory)
    navigateToCursor(nextCursor)
  }, [nextCursor, cursorHistory, currentCursor, writeCursorHistory, navigateToCursor])

  const goPrevPage = useCallback(() => {
    if (cursorHistory.length === 0) {
      navigateToCursor(null)
      return
    }
    const nextHistory = cursorHistory.slice(0, -1)
    writeCursorHistory(nextHistory)
    const prevCursor = nextHistory.length ? nextHistory[nextHistory.length - 1] : ""
    navigateToCursor(prevCursor || null)
  }, [cursorHistory, writeCursorHistory, navigateToCursor])

  const changePageSize = useCallback(
    (nextPageSize: (typeof ADMIN_CUSTOMERS_PAGE_SIZE_OPTIONS)[number]) => {
      writeCursorHistory([])
      const queryString = buildQuery({
        limit: String(nextPageSize),
        cursor: undefined,
      })
      router.push(queryString ? `/admin/customers?${queryString}` : "/admin/customers")
    },
    [router, buildQuery, writeCursorHistory],
  )

  const setFilters = useCallback(
    (next: { status?: AccountStatusFilter; search?: string }) => {
      const params = new URLSearchParams()
      const nextStatusFilter = (next.status ?? statusFilter) || "all"
      const nextSearchText = (next.search ?? searchText).trim()

      if (nextStatusFilter && nextStatusFilter !== "all") params.set("status", nextStatusFilter)
      if (nextSearchText) params.set("search", nextSearchText)
      if (searchField && searchField !== "name") params.set("qMode", searchField)
      const queryString = params.toString()
      writeCursorHistory([])
      router.push(queryString ? `/admin/customers?${queryString}` : "/admin/customers")
    },
    [router, writeCursorHistory, statusFilter, searchText, searchField],
  )

  const { value: searchInput, onChange: onSearchChange } = useAdminSearchInput(searchText, (q) =>
    setFilters({ search: q }),
  )

  const statusLabel = useMemo(() => {
    if (statusFilter === "active") return "Active"
    if (statusFilter === "locked") return "Locked"
    return "All Status"
  }, [statusFilter])

  const qModeOptions = useMemo(
    () => [
      { value: "name", label: "Name" },
      { value: "email", label: "Email" },
      { value: "phone", label: "Phone" },
    ],
    [],
  )

  const searchPlaceholder = useMemo(() => {
    if (searchField === "name") return "Search by customer name"
    if (searchField === "email") return "Search by customer email"
    if (searchField === "phone") return "Search by customer phone"
    return "Search name / phone / email"
  }, [searchField])

  const setSearchField = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next === "name") params.delete("qMode")
      else params.set("qMode", next)
      params.delete("cursor")
      writeCursorHistory([])
      router.replace(`/admin/customers?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, writeCursorHistory],
  )

  const lockCustomer = useCallback(
    async (customerId: string) => {
      setPendingCustomerId(customerId)
      try {
        await lockAdminCustomer(customerId)
        showToast("Customer locked", "success", 3000)
        await fetchCustomers()
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Lock failed", "error", 5000)
      } finally {
        setPendingCustomerId(null)
      }
    },
    [showToast, fetchCustomers],
  )

  const unlockCustomer = useCallback(
    async (customerId: string) => {
      setPendingCustomerId(customerId)
      try {
        await unlockAdminCustomer(customerId)
        showToast("Customer unlocked", "success", 3000)
        await fetchCustomers()
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Unlock failed", "error", 5000)
      } finally {
        setPendingCustomerId(null)
      }
    },
    [showToast, fetchCustomers],
  )

  return {
    PAGE_SIZE_OPTIONS: ADMIN_CUSTOMERS_PAGE_SIZE_OPTIONS,
    statusFilter,
    searchField,
    currentCursor,
    pageSize,
    customers,
    nextCursor,
    cursorHistory,
    pageIndex,
    totalPagesHint,
    loading,
    error,
    pendingCustomerId,
    isStatusMenuOpen,
    setIsStatusMenuOpen,
    statusMenuRef,
    statusLabel,
    qModeOptions,
    searchInput,
    onSearchChange,
    searchPlaceholder,
    setSearchField,
    setFilters,
    goPrevPage,
    goNextPage,
    changePageSize,
    lockCustomer,
    unlockCustomer,
  }
}

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
  const limit = Math.min(50, Math.max(10, Number(searchParams.get("limit") || "10") || 10))

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
        const insideMenu = !!actionMenuElRef.current && !!target && actionMenuElRef.current.contains(target)
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
    (next: { status?: EnterpriseListTab; search?: string; page?: number; limit?: number }) => {
      const p = new URLSearchParams()
      const s = (next.status ?? tab) || "all"
      const q = (next.search ?? search).trim()
      const nextPage = Math.max(1, Number(next.page ?? page) || 1)
      const clampedLimit = Math.min(50, Math.max(10, Number(next.limit ?? limit) || 10))
      if (s && s !== "all") p.set("status", s)
      if (q) p.set("search", q)
      if (nextPage !== 1) p.set("page", String(nextPage))
      if (clampedLimit !== 10) p.set("limit", String(clampedLimit))
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
      showToast(unlockModal.mode === "approve" ? "Enterprise approved" : "Enterprise activated", "success", 3000)
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
  const visibleRows = useMemo(() => enterprises.slice(pageStart, pageEnd), [enterprises, pageStart, pageEnd])

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

