"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/contexts/toast-context"
import { AuditLogsHeader } from "@/components/admin/platform/audit-logs/ui/AuditLogsHeader"
import { AuditLogsFiltersCard } from "@/components/admin/platform/audit-logs/ui/AuditLogsFiltersCard"
import { AuditLogsTableCard } from "@/components/admin/platform/audit-logs/ui/AuditLogsTableCard"
import type { AdminAuditLogsListResponse, AdminAuditLogsOptionsResponse } from "@/types/admin-api.types"
import {
  exportAdminAuditLogsCsv,
  getAdminAuditLogsOptions,
  listAdminAuditLogs,
} from "@/services/admin.service"
import type { AdminFilterOption } from "@/components/admin/shared/AdminFilterMenu"
import { PAGE_SIZE_OPTIONS, RANGE_FILTER_OPTIONS } from "@/components/admin/platform/audit-logs/constants"
import type { AuditLogRow } from "@/components/admin/platform/audit-logs/types"

export default function AuditLogsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { showToast } = useToast()

  const [search, setSearch] = useState(searchParams.get("search")?.trim() || "")
  const [module, setModule] = useState(searchParams.get("module") || "All Modules")
  const [action, setAction] = useState(searchParams.get("action") || "All Actions")
  const [rowStatus, setRowStatus] = useState(searchParams.get("status") || "All Statuses")
  const [user, setUser] = useState(searchParams.get("user") || "All Users")
  const [role, setRole] = useState(searchParams.get("role") || "All Roles")
  const [openFilterMenuId, setOpenFilterMenuId] = useState<string | null>(null)

  const [page, setPage] = useState(Math.max(1, Number(searchParams.get("page") || "1") || 1))
  const limitParam = Number(searchParams.get("limit") || "") || 12
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(
    (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam) ? (limitParam as any) : 12,
  )

  const rangeParam = searchParams.get("range") || "last30"
  const selectedRangeValue = (
    ["last7", "last30", "today", "custom"].includes(rangeParam) ? rangeParam : "last30"
  ) as (typeof RANGE_FILTER_OPTIONS)[number]["value"]

  const order = (searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc"

  const [options, setOptions] = useState<AdminAuditLogsOptionsResponse | null>(null)
  const [data, setData] = useState<AdminAuditLogsListResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
  })

  const setRangeQueryParam = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "")
      if (value) params.set("range", value)
      else params.delete("range")
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname)
    },
    [router, pathname, searchParams],
  )

  const fetchOptions = useCallback(async () => {
    try {
      const res = await getAdminAuditLogsOptions()
      setOptions(res)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to load filter options", "error", 5000)
    }
  }, [showToast])

  const fetchList = useCallback(async () => {
    try {
      const res = await listAdminAuditLogs({
        search: search.trim() || undefined,
        user: user !== "All Users" ? user : undefined,
        role: role !== "All Roles" ? role : undefined,
        module: module !== "All Modules" ? module : undefined,
        action: action !== "All Actions" ? action : undefined,
        status:
          rowStatus === "All Statuses"
            ? undefined
            : rowStatus === "Success"
              ? "success"
              : "failure",
        range: selectedRangeValue,
        page,
        limit: pageSize,
        order: order as any,
      })
      setData(res)
    } catch {
      setData({ items: [], total: 0, page, limit: pageSize })
    }
  }, [search, user, role, module, action, rowStatus, selectedRangeValue, page, pageSize, order])

  useEffect(() => {
    void fetchOptions()
  }, [fetchOptions])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const rows: AuditLogRow[] = useMemo(() => {
    return (data.items || []).map((r) => ({
      id: r.AuditLogID,
      timestamp: r.CreatedAt,
      user: r.User,
      role: r.Role,
      module: r.Module,
      action: r.Action,
      status: r.Status,
      description: r.Description,
      ipAddress: r.IpAddress,
    }))
  }, [data.items])

  const handleRefresh = () => {
    void fetchList()
  }

  const handleExport = async () => {
    try {
      const blob = await exportAdminAuditLogsCsv({
        search: search.trim() || undefined,
        user: user !== "All Users" ? user : undefined,
        role: role !== "All Roles" ? role : undefined,
        module: module !== "All Modules" ? module : undefined,
        action: action !== "All Actions" ? action : undefined,
        status:
          rowStatus === "All Statuses"
            ? undefined
            : rowStatus === "Success"
              ? "success"
              : "failure",
        range: selectedRangeValue,
        order: order as any,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "audit-logs.csv"
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Export failed", "error", 5000)
    }
  }

  const fallbackModules = useMemo(
    () => [
      "customers",
      "enterprises",
      "enterprise-invitations",
      "orders",
      "support",
      "vouchers",
      "reviews",
      "dashboard",
      "finance",
      "commission-fees",
      "transaction-fees",
      "payout-requests",
      "audit-logs",
      "settings",
      "registry",
    ],
    [],
  )

  const fallbackActions = useMemo(() => ["CREATE", "UPDATE", "DELETE"], [])

  const fallbackRoles = useMemo(() => ["Admin", "Enterprise", "Customer"], [])

  const moduleOptions: AdminFilterOption[] = useMemo(() => {
    const base = [{ value: "All Modules", label: "All Modules" }]
    const moduleList =
      (options?.modules && options.modules.length ? options.modules : fallbackModules) || []
    return base.concat(moduleList.map((moduleName) => ({ value: moduleName, label: moduleName })))
  }, [options?.modules, fallbackModules])

  const actionOptions: AdminFilterOption[] = useMemo(() => {
    const base = [{ value: "All Actions", label: "All Actions" }]
    const actionList =
      (options?.actions && options.actions.length ? options.actions : fallbackActions) || []
    return base.concat(actionList.map((actionName) => ({ value: actionName, label: actionName })))
  }, [options?.actions, fallbackActions])

  const statusOptions: AdminFilterOption[] = useMemo(() => {
    return [
      { value: "All Statuses", label: "All Statuses" },
      { value: "Success", label: "Success" },
      { value: "Failure", label: "Failure" },
    ]
  }, [])

  const userOptions: AdminFilterOption[] = useMemo(() => {
    const base = [{ value: "All Users", label: "All Users" }]
    const userList = options?.users || []
    return base.concat(userList.map((u) => ({ value: u.id, label: u.label })))
  }, [options?.users])

  const roleOptions: AdminFilterOption[] = useMemo(() => {
    const base = [{ value: "All Roles", label: "All Roles" }]
    const roleList = (options?.roles && options.roles.length ? options.roles : fallbackRoles) || []
    return base.concat(roleList.map((roleName) => ({ value: roleName, label: roleName })))
  }, [options?.roles, fallbackRoles])

  const syncQuery = useCallback(
    (next: {
      search?: string
      user?: string
      role?: string
      module?: string
      action?: string
      status?: string
      range?: string
      page?: number
      limit?: number
      order?: "asc" | "desc"
    }) => {
      const params = new URLSearchParams()

      const nextSearch = (next.search ?? search).trim()
      const nextUser = next.user ?? user
      const nextRole = next.role ?? role
      const nextModule = next.module ?? module
      const nextAction = next.action ?? action
      const nextStatus = next.status ?? rowStatus
      const nextRange = next.range ?? selectedRangeValue
      const nextPage = Math.max(1, Number(next.page ?? page) || 1)
      const nextLimit = next.limit ?? pageSize
      const nextOrder = next.order ?? (order as any)

      if (nextSearch) params.set("search", nextSearch)
      if (nextUser !== "All Users") params.set("user", nextUser)
      if (nextRole !== "All Roles") params.set("role", nextRole)
      if (nextModule !== "All Modules") params.set("module", nextModule)
      if (nextAction !== "All Actions") params.set("action", nextAction)
      if (nextStatus !== "All Statuses") params.set("status", nextStatus)
      if (nextRange && nextRange !== "last30") params.set("range", nextRange)
      if (nextPage !== 1) params.set("page", String(nextPage))
      if (nextLimit !== 12) params.set("limit", String(nextLimit))
      if (nextOrder !== "desc") params.set("order", nextOrder)

      const queryString = params.toString()
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
    },
    [
      router,
      pathname,
      search,
      user,
      role,
      module,
      action,
      rowStatus,
      selectedRangeValue,
      page,
      pageSize,
      order,
    ],
  )

  const toggleOrder = useCallback(() => {
    const next = order === "asc" ? "desc" : "asc"
    syncQuery({ order: next as any, page: 1 })
  }, [order, syncQuery])

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="space-y-3">
        <AuditLogsHeader onRefresh={handleRefresh} onExport={handleExport} />

        <AuditLogsFiltersCard
          search={search}
          setSearch={(v) => {
            setSearch(v)
            syncQuery({ search: v, page: 1 })
          }}
          module={module}
          setModule={(v) => {
            setModule(v)
            syncQuery({ module: v, page: 1 })
          }}
          action={action}
          setAction={(v) => {
            setAction(v)
            syncQuery({ action: v, page: 1 })
          }}
          rowStatus={rowStatus}
          setRowStatus={(v) => {
            setRowStatus(v)
            syncQuery({ status: v, page: 1 })
          }}
          user={user}
          setUser={(v) => {
            setUser(v)
            syncQuery({ user: v, page: 1 })
          }}
          role={role}
          setRole={(v) => {
            setRole(v)
            syncQuery({ role: v, page: 1 })
          }}
          moduleOptions={moduleOptions}
          actionOptions={actionOptions}
          statusOptions={statusOptions}
          userOptions={userOptions}
          roleOptions={roleOptions}
          selectedRangeValue={selectedRangeValue}
          setRangeQueryParam={setRangeQueryParam}
          openFilterMenuId={openFilterMenuId}
          setOpenFilterMenuId={setOpenFilterMenuId}
          onAnyChange={() => {}}
        />

        <AuditLogsTableCard
          rows={rows}
          total={data.total}
          page={page}
          setPage={(p) => {
            setPage(p)
            syncQuery({ page: p })
          }}
          pageSize={pageSize}
          setPageSize={(n) => {
            setPageSize(n)
            syncQuery({ limit: n, page: 1 })
          }}
          order={order as any}
          onToggleOrder={toggleOrder}
        />
      </div>
    </div>
  )
}

