"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAdminSearchInput } from "@/hooks/use-admin-search-input"
import { useToast } from "@/contexts/toast-context"
import {
  listAdminCustomers,
  lockAdminCustomer,
  unlockAdminCustomer,
} from "@/services/admin.service"
import type { AdminCustomerListItem } from "@/types/admin-api.types"

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const

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
  const pageSize = (PAGE_SIZE_OPTIONS.includes(limitParam as any) ? (limitParam as any) : 12) as (typeof PAGE_SIZE_OPTIONS)[number]

  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null)

  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)

  const cursorHistoryKey = useMemo(() => {
    return [
      "adminCustomersCursorStack",
      statusFilter,
      searchText,
      searchField,
      String(pageSize),
    ].join("|")
  }, [statusFilter, searchText, searchField, pageSize])

  const cursorHistory = useMemo(() => {
    try {
      const storedValue = sessionStorage.getItem(cursorHistoryKey)
      const parsedList = storedValue ? (JSON.parse(storedValue) as string[]) : []
      return Array.isArray(parsedList)
        ? parsedList.filter((cursorValue) => typeof cursorValue === "string")
        : []
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
      router.push(
        queryString ? `/admin/customers?${queryString}` : "/admin/customers",
      )
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
    (nextPageSize: (typeof PAGE_SIZE_OPTIONS)[number]) => {
      writeCursorHistory([])
      const queryString = buildQuery({
        limit: String(nextPageSize),
        cursor: undefined,
      })
      router.push(
        queryString ? `/admin/customers?${queryString}` : "/admin/customers",
      )
    },
    [router, buildQuery, writeCursorHistory],
  )

  const setFilters = useCallback(
    (next: { status?: AccountStatusFilter; search?: string }) => {
      const params = new URLSearchParams()
      const nextStatusFilter = (next.status ?? statusFilter) || "all"
      const nextSearchText = (next.search ?? searchText).trim()

      if (nextStatusFilter && nextStatusFilter !== "all") {
        params.set("status", nextStatusFilter)
      }
      if (nextSearchText) params.set("search", nextSearchText)
      if (searchField && searchField !== "name") params.set("qMode", searchField)
      const queryString = params.toString()
      writeCursorHistory([])
      router.push(
        queryString ? `/admin/customers?${queryString}` : "/admin/customers",
      )
    },
    [router, writeCursorHistory, statusFilter, searchText, searchField],
  )

  const { value: searchInput, onChange: onSearchChange } = useAdminSearchInput(
    searchText,
    (q) => setFilters({ search: q }),
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
    PAGE_SIZE_OPTIONS,
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

