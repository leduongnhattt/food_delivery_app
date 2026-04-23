"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Download, RefreshCw, Search } from "lucide-react"
import {
  AdminFilterMenu,
  adminFilterOptionsFromStrings,
} from "@/components/admin/shared/AdminFilterMenu"
import { Pagination } from "@/components/ui/pagination"
import { mergeClasses, formatDate } from "@/lib/utils"

type AuditLogStatus = "Success" | "Failed" | "Pending"

type AuditLogRow = {
  id: string
  timestamp: string
  user: string
  role: string
  module: string
  action: string
  stage: string
  status: AuditLogStatus
  description: string
  entityId: string
  ipAddress: string
}

const MODULE_OPTIONS = ["All Modules", "commission_fee", "service_fee", "orders", "customers"] as const
const ACTION_OPTIONS = ["All Actions", "CREATE", "UPDATE", "DELETE"] as const
const ROW_STATUS_OPTIONS = ["All Statuses", "Success", "Failed", "Pending"] as const
const USER_OPTIONS = ["All Users", "admin@medusa-test.com", "system"] as const
const ROLE_OPTIONS = ["All Roles", "admin", "system"] as const

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const

const RANGE_FILTER_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last 1 year" },
] as const

function StatusPill({ status }: { status: AuditLogStatus }) {
  const style =
    status === "Success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
      : status === "Failed"
        ? "bg-rose-50 text-rose-700 ring-rose-100"
        : "bg-amber-50 text-amber-700 ring-amber-100"

  return (
    <span
      className={mergeClasses(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1",
        style,
      )}
    >
      {status}
    </span>
  )
}


function mockAuditLogs(): AuditLogRow[] {
  const rows: AuditLogRow[] = [
    {
      id: "1",
      timestamp: "2026-04-20T20:16:13.000Z",
      user: "admin@medusa-test.com",
      role: "admin",
      module: "commission_fee",
      action: "UPDATE",
      stage: "persist",
      status: "Success",
      description: "Commission fee 'Anhnh test exclude' deactivated",
      entityId: "conf_0LKYPRDCRSE7T7DNFQATYSEDH1",
      ipAddress: "42.118.128.117",
    },
    {
      id: "2",
      timestamp: "2026-04-20T21:04:12.000Z",
      user: "admin@medusa-test.com",
      role: "admin",
      module: "commission_fee",
      action: "CREATE",
      stage: "persist",
      status: "Success",
      description: "Commission fee 'Anhnh test exclude' created",
      entityId: "conf_0LKYPRDCRSE7T7DNFQATYSEDH2",
      ipAddress: "42.118.128.137",
    },
    {
      id: "3",
      timestamp: "2026-04-18T08:36:58.000Z",
      user: "admin@medusa-test.com",
      role: "admin",
      module: "commission_fee",
      action: "UPDATE",
      stage: "response",
      status: "Success",
      description: "Commission fee 'Sig Comm - Include' updated",
      entityId: "conf_0LKYPRDCRSE7T7DNFQATYSEDH3",
      ipAddress: "38.187.36.103",
    },
    {
      id: "4",
      timestamp: "2026-04-17T23:00:02.000Z",
      user: "system",
      role: "system",
      module: "service_fee",
      action: "UPDATE",
      stage: "persist",
      status: "Success",
      description: "Service fee 'Platform service fee' deactivated",
      entityId: "conf_0LKYPRDCRSE7T7DNFQATYSEDH4",
      ipAddress: "135.185.57.28",
    },
  ]

  const more = Array.from({ length: 8 }).map((_, idx) => ({
    ...rows[idx % rows.length],
    id: `m-${idx + 1}`,
    timestamp: new Date(Date.now() - (idx + 1) * 36e5).toISOString(),
    entityId: `${rows[idx % rows.length].entityId}_${idx + 1}`,
  }))

  return [...rows, ...more].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

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
        {/* Header (no card) */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-slate-900">Audit Logs</h1>
            <p className="mt-0.5 text-xs leading-snug text-slate-600">
              View and filter system audit logs for Create, Update, and Delete actions across the platform.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className={mergeClasses(
                "inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-normal text-slate-700 shadow-sm",
                "hover:bg-slate-50 active:bg-slate-100 transition-colors",
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              className={mergeClasses(
                "inline-flex h-8 items-center gap-1.5 rounded-md bg-blue-600 px-2.5 text-xs font-medium text-white shadow-sm",
                "hover:bg-blue-700 active:bg-blue-800 transition-colors",
              )}
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Filters card */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="min-w-0 lg:col-span-6">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      aria-label="Search by description or IP address"
                      placeholder="Search by description or IP address"
                      className={mergeClasses(
                        "h-8 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2.5 text-xs shadow-sm",
                        "placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition-colors",
                      )}
                    />
                  </div>
                </div>

                <div className="min-w-0 lg:col-span-3">
                  <AdminFilterMenu
                    menuId="user"
                    ariaLabel="Users"
                    value={user}
                    options={adminFilterOptionsFromStrings(USER_OPTIONS)}
                    onChange={(v) => {
                      setUser(v as (typeof USER_OPTIONS)[number])
                      setPage(1)
                    }}
                    openMenuId={openFilterMenuId}
                    setOpenMenuId={setOpenFilterMenuId}
                  />
                </div>
                <div className="min-w-0 lg:col-span-3">
                  <AdminFilterMenu
                    menuId="role"
                    ariaLabel="Roles"
                    value={role}
                    options={adminFilterOptionsFromStrings(ROLE_OPTIONS)}
                    onChange={(v) => {
                      setRole(v as (typeof ROLE_OPTIONS)[number])
                      setPage(1)
                    }}
                    openMenuId={openFilterMenuId}
                    setOpenMenuId={setOpenFilterMenuId}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                <div className="min-w-0 lg:col-span-3">
                  <AdminFilterMenu
                    menuId="module"
                    ariaLabel="Modules"
                    value={module}
                    options={adminFilterOptionsFromStrings(MODULE_OPTIONS)}
                    onChange={(v) => {
                      setModule(v as (typeof MODULE_OPTIONS)[number])
                      setPage(1)
                    }}
                    openMenuId={openFilterMenuId}
                    setOpenMenuId={setOpenFilterMenuId}
                  />
                </div>
                <div className="min-w-0 lg:col-span-3">
                  <AdminFilterMenu
                    menuId="action"
                    ariaLabel="Actions"
                    value={action}
                    options={adminFilterOptionsFromStrings(ACTION_OPTIONS)}
                    onChange={(v) => {
                      setAction(v as (typeof ACTION_OPTIONS)[number])
                      setPage(1)
                    }}
                    openMenuId={openFilterMenuId}
                    setOpenMenuId={setOpenFilterMenuId}
                  />
                </div>
                <div className="min-w-0 lg:col-span-3">
                  <AdminFilterMenu
                    menuId="rowStatus"
                    ariaLabel="Statuses"
                    value={rowStatus}
                    options={adminFilterOptionsFromStrings(ROW_STATUS_OPTIONS)}
                    onChange={(v) => {
                      setRowStatus(v as (typeof ROW_STATUS_OPTIONS)[number])
                      setPage(1)
                    }}
                    openMenuId={openFilterMenuId}
                    setOpenMenuId={setOpenFilterMenuId}
                  />
                </div>
                <div className="min-w-0 lg:col-span-3">
                  <AdminFilterMenu
                    menuId="range"
                    ariaLabel="Date range"
                    value={selectedRangeValue}
                    options={[...RANGE_FILTER_OPTIONS]}
                    onChange={(v) => {
                      setRangeQueryParam(v)
                      setPage(1)
                    }}
                    openMenuId={openFilterMenuId}
                    setOpenMenuId={setOpenFilterMenuId}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table card */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="w-full min-w-0 overflow-x-hidden">
            <table className="table-fixed w-full border-t border-slate-200 text-[11px] leading-[1.55] sm:text-[12px] sm:leading-[1.6]">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[14%]" />
              <col className="w-[7%]" />
              <col className="w-[11%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[28%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                <th className="py-2 pr-2 pl-4 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                  Timestamp
                </th>
                <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                  User
                </th>
                <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                  Role
                </th>
                <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                  Module
                </th>
                <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                  Action
                </th>
                <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                  Status
                </th>
                <th className="py-2 pr-2 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                  Description
                </th>
                <th className="py-2 pr-4 align-top text-[11px] font-bold uppercase tracking-wide text-slate-600 sm:text-[12px] sm:normal-case sm:tracking-normal">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No logs found.
                  </td>
                </tr>
              ) : (
                pagedRows.map((r) => (
                  <tr key={r.id} className="bg-white hover:bg-slate-50/70">
                    <td className="min-w-0 py-2 pr-2 pl-4 align-top text-slate-700 break-words whitespace-normal">
                      {formatDate(r.timestamp)}
                    </td>
                    <td className="min-w-0 py-2 pr-2 align-top font-medium text-[oklch(0.21_0.034_264.665)] break-all">
                      {r.user}
                    </td>
                    <td className="min-w-0 py-2 pr-2 align-top text-slate-700 break-words">
                      {r.role}
                    </td>
                    <td className="min-w-0 py-2 pr-2 align-top text-slate-700 break-all">
                      {r.module}
                    </td>
                    <td className="min-w-0 py-2 pr-2 align-top font-medium text-[oklch(0.21_0.034_264.665)] break-words">
                      {r.action}
                    </td>
                    <td className="min-w-0 py-2 pr-2 align-top">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="min-w-0 py-2 pr-2 align-top text-slate-700 break-words">
                      {r.description}
                    </td>
                    <td className="min-w-0 py-2 pr-4 align-top font-mono text-slate-700 break-all">
                      {r.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={filteredRows.length}
            onPageChange={(nextPage) => setPage(nextPage)}
            onPageSizeChange={(n) => {
              setPageSize(n as (typeof PAGE_SIZE_OPTIONS)[number])
              setPage(1)
            }}
          />
        </div>
      </div>
    </div>
  )
}

