"use client"

import React, { useCallback, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ACTION_OPTIONS,
  MODULE_OPTIONS,
  PAGE_SIZE_OPTIONS,
  RANGE_FILTER_OPTIONS,
  ROLE_OPTIONS,
  ROW_STATUS_OPTIONS,
  USER_OPTIONS,
} from "@/components/admin/platform/audit-logs/constants"
import { mockAuditLogs } from "@/components/admin/platform/audit-logs/mock"
import { AuditLogsHeader } from "@/components/admin/platform/audit-logs/ui/AuditLogsHeader"
import { AuditLogsFiltersCard } from "@/components/admin/platform/audit-logs/ui/AuditLogsFiltersCard"
import { AuditLogsTableCard } from "@/components/admin/platform/audit-logs/ui/AuditLogsTableCard"

export default function AuditLogsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState("")
  const [module, setModule] = useState<(typeof MODULE_OPTIONS)[number]>("All Modules")
  const [action, setAction] = useState<(typeof ACTION_OPTIONS)[number]>("All Actions")
  const [rowStatus, setRowStatus] = useState<(typeof ROW_STATUS_OPTIONS)[number]>("All Statuses")
  const [user, setUser] = useState<(typeof USER_OPTIONS)[number]>("All Users")
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("All Roles")
  const [openFilterMenuId, setOpenFilterMenuId] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(12)

  const auditLogRows = useMemo(() => mockAuditLogs(), [])

  const rangeParam = searchParams.get("range") || "30d"
  const selectedRangeValue = (
    ["7d", "30d", "90d", "1y"].includes(rangeParam) ? rangeParam : "30d"
  ) as (typeof RANGE_FILTER_OPTIONS)[number]["value"]

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

  const filteredRows = useMemo(() => {
    const searchQuery = search.trim().toLowerCase()
    return auditLogRows.filter((r) => {
      if (module !== "All Modules" && r.module !== module) return false
      if (action !== "All Actions" && r.action !== action) return false
      if (rowStatus !== "All Statuses" && r.status !== rowStatus) return false
      if (user !== "All Users" && r.user !== user) return false
      if (role !== "All Roles" && r.role !== role) return false

      if (!searchQuery) return true
      const searchableText = [r.description, r.ipAddress].join(" ").toLowerCase()
      return searchableText.includes(searchQuery)
    })
  }, [auditLogRows, search, module, action, rowStatus, user, role])

  const pagedRows = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
    const safePage = Math.min(Math.max(1, page), totalPages)
    const start = (safePage - 1) * pageSize
    return filteredRows.slice(start, start + pageSize)
  }, [filteredRows, page, pageSize])

  const handleRefresh = () => {
    // UI-only mock: keep identical behavior while page remains static
    setPage(1)
  }

  const handleExport = () => {
    const header = [
      "timestamp",
      "user",
      "role",
      "module",
      "action",
      "stage",
      "status",
      "description",
      "entityId",
      "ipAddress",
    ]
    const escapeCSV = (s: string) => `"${String(s).replace(/"/g, '""')}"`
    const lines = filteredRows.map((r) =>
      [
        r.timestamp,
        r.user,
        r.role,
        r.module,
        r.action,
        r.stage,
        r.status,
        r.description,
        r.entityId,
        r.ipAddress,
      ]
        .map(escapeCSV)
        .join(","),
    )

    const csv = [header.join(","), ...lines].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "audit-logs.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="space-y-3">
        <AuditLogsHeader onRefresh={handleRefresh} onExport={handleExport} />

        <AuditLogsFiltersCard
          search={search}
          setSearch={setSearch}
          module={module}
          setModule={setModule}
          action={action}
          setAction={setAction}
          rowStatus={rowStatus}
          setRowStatus={setRowStatus}
          user={user}
          setUser={setUser}
          role={role}
          setRole={setRole}
          selectedRangeValue={selectedRangeValue}
          setRangeQueryParam={setRangeQueryParam}
          openFilterMenuId={openFilterMenuId}
          setOpenFilterMenuId={setOpenFilterMenuId}
          onAnyChange={() => setPage(1)}
        />

        <AuditLogsTableCard
          rows={pagedRows}
          total={filteredRows.length}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>
    </div>
  )
}

