"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Search, CheckCircle2, Timer, Ban, Eye, MoreVertical, Check, Users, ChevronDown } from "lucide-react"
import {
  listAdminEnterprises,
  lockAdminEnterpriseAccount,
  unlockAdminEnterpriseAccount,
  listAdminEnterpriseInvitations,
} from "@/services/admin.service"
import type { AdminEnterpriseListItem } from "@/types/admin-api.types"

export default function EnterprisesListAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = (searchParams.get("status") || "all") as "all" | "active" | "locked"
  const search = searchParams.get("search")?.trim() || ""
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1)
  const limit = Math.min(50, Math.max(5, Number(searchParams.get("limit") || "10") || 10))

  const [enterprises, setEnterprises] = useState<AdminEnterpriseListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null)
  const [pendingInvitations, setPendingInvitations] = useState<number>(0)
  const [actionMenu, setActionMenu] = useState<{
    enterpriseId: string
    accountId: string
    canApprove: boolean
    left: number
    top: number
  } | null>(null)
  const actionMenuElRef = useRef<HTMLDivElement | null>(null)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)
  const [openLimitMenu, setOpenLimitMenu] = useState(false)
  const limitMenuRef = useRef<HTMLDivElement | null>(null)

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
    function onDocClick(ev: MouseEvent) {
      const target = ev.target as HTMLElement | null

      // Close action menu only when clicking outside the menu/button area
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

  async function onLock(accountId: string) {
    setPendingAccountId(accountId)
    try {
      await lockAdminEnterpriseAccount(accountId)
      router.push("/admin/enterprises/list?status=locked")
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lock failed")
    } finally {
      setPendingAccountId(null)
    }
  }

  async function onUnlock(accountId: string) {
    setPendingAccountId(accountId)
    try {
      await unlockAdminEnterpriseAccount(accountId)
      router.push("/admin/enterprises/list?status=active")
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unlock failed")
    } finally {
      setPendingAccountId(null)
    }
  }

  const stats = useMemo(() => {
    const total = enterprises.length
    const active = enterprises.filter((e) => e.account.Status === "Active").length
    const suspended = enterprises.filter((e) => e.account.Status !== "Active").length
    const pending = pendingInvitations
    return { total, active, pending, suspended }
  }, [enterprises, pendingInvitations])

  function setQuery(next: {
    status?: "all" | "active" | "locked"
    search?: string
    page?: number
    limit?: number
  }) {
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
    router.push(qs ? `/admin/enterprises/list?${qs}` : "/admin/enterprises/list")
  }

  const statusLabel = useMemo(() => {
    if (tab === "active") return "Active"
    if (tab === "locked") return "Suspended"
    return "All Status"
  }, [tab])

  const totalRows = enterprises.length
  const totalPages = Math.max(1, Math.ceil(totalRows / limit))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * limit
  const pageEnd = Math.min(totalRows, pageStart + limit)
  const visibleRows = useMemo(
    () => enterprises.slice(pageStart, pageEnd),
    [enterprises, pageStart, pageEnd],
  )

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
            Enterprise List
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            View and manage all enterprises on the platform.
          </p>
        </div>

        {/* Search & filter (card) */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="w-full flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                className="w-full border-0 appearance-none placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 gap-2 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 ps-10 text-[13px] py-2.5 ring-slate-200 bg-white"
                  placeholder="Search Enterprise Name / Email"
                  defaultValue={search}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = (e.target as HTMLInputElement).value
                      setQuery({ search: v, page: 1 })
                    }
                  }}
                />
              </div>
            </div>

            <div className="w-full shrink-0 sm:w-40">
              <div ref={statusMenuRef} className="relative">
                <button
                  type="button"
                  onMouseDown={(ev) => {
                    ev.stopPropagation()
                  }}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setOpenStatusMenu((v) => !v)
                  }}
                  className="relative group inline-flex items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] md:text-[13px] py-2.5 px-3 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 disabled:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200 w-full"
                >
                  <span className="truncate">{statusLabel}</span>
                  <ChevronDown
                    className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                      openStatusMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openStatusMenu && (
                  <div
                    onClick={(ev) => ev.stopPropagation()}
                    className="absolute right-0 mt-2 w-full min-w-[160px] rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        setQuery({ status: "all", page: 1 })
                      }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>All Status</span>
                      {tab === "all" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        setQuery({ status: "active", page: 1 })
                      }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>Active</span>
                      {tab === "active" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        router.push("/admin/enterprises/invitations?status=pending")
                      }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>Pending</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false)
                        setQuery({ status: "locked", page: 1 })
                      }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>Suspended</span>
                      {tab === "locked" && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monitor (card) */}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
          Monitor enterprise activity, status, and performance. Approve pending enterprises or suspend accounts as needed.
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="space-y-1 flex-1">
                <p className="text-xs text-gray-500 font-medium">Total Enterprises</p>
                <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 flex items-center rounded justify-center size-12 shrink-0 bg-blue-100">
                <Users className="size-5 text-sky-700" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="space-y-1 flex-1">
                <p className="text-xs text-gray-500 font-medium">Active</p>
                <p className="text-xl font-semibold text-gray-900">{stats.active}</p>
              </div>
              <div className="p-2 flex items-center rounded justify-center size-12 shrink-0 bg-green-100">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="space-y-1 flex-1">
                <p className="text-xs text-gray-500 font-medium">Pending</p>
                <p className="text-xl font-semibold text-gray-900">{stats.pending}</p>
              </div>
              <div className="p-2 flex items-center rounded justify-center size-12 shrink-0 bg-yellow-100">
                <Timer className="size-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="space-y-1 flex-1">
                <p className="text-xs text-gray-500 font-medium">Suspended</p>
                <p className="text-xl font-semibold text-gray-900">{stats.suspended}</p>
              </div>
              <div className="p-2 flex items-center rounded justify-center size-12 shrink-0 bg-red-100">
                <Ban className="size-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 text-rose-800 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {/* Table (framed like CMS) */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto px-4">
            {loading ? (
              <div className="text-center text-slate-500 py-10">Loading…</div>
            ) : (
              <table className="min-w-full text-[12px] leading-4">
                <thead>
                  <tr className="bg-[#f9fbfc] text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Enterprise ID
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Enterprise Name
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Email
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Status
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Phone
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Joined
                    </th>
                    <th className="py-2 pr-0 text-right w-40 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map((e) => (
                    <tr key={e.EnterpriseID}>
                      <td className="py-2 pr-4 text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                        {String(e.EnterpriseID).slice(0, 8)}
                      </td>
                      <td className="py-2 pr-4">
                        <span className="text-[12px] leading-4 font-medium text-blue-600 hover:underline cursor-default">
                          {e.EnterpriseName}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                        {e.account.Email}
                      </td>
                      <td className="py-2 pr-4">
                        {e.account.Status === "Active" ? (
                          <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 capitalize">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">{e.PhoneNumber}</td>
                      <td className="py-2 pr-4 text-slate-700">
                        {formatDate(String(e.CreatedAt)).split(",")[0]}
                      </td>
                      <td className="py-2 pr-0 text-right w-40">
                        <div className="flex items-center justify-end">
                          <Link
                            href={`/admin/enterprises/${encodeURIComponent(e.EnterpriseID)}`}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs leading-4 font-medium text-[#2563FF] hover:bg-blue-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>

                          <div className="relative inline-flex justify-end">
                            <button
                              type="button"
                              onClick={(ev) => {
                                ev.stopPropagation()
                                const btn = ev.currentTarget as HTMLButtonElement
                                const rect = btn.getBoundingClientRect()
                                const MENU_W = 160
                                const pad = 8
                                const left = Math.min(
                                  window.innerWidth - pad - MENU_W,
                                  Math.max(pad, rect.right - MENU_W),
                                )
                                const top = rect.bottom + 8
                                setActionMenu((cur) =>
                                  cur?.enterpriseId === e.EnterpriseID
                                    ? null
                                    : {
                                        enterpriseId: e.EnterpriseID,
                                        accountId: e.account.AccountID,
                                        canApprove: e.account.Status !== "Active",
                                        left,
                                        top,
                                      },
                                )
                              }}
                              className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition"
                              aria-label="Actions"
                              data-action-menu-trigger="true"
                            >
                              <MoreVertical className="w-4 h-4 text-slate-700" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && totalRows === 0 && (
              <div className="text-center text-slate-500 py-10">No enterprises</div>
            )}
          </div>

          {/* Table footer pagination (UI like CMS) */}
          {!loading && totalRows > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Showing <span className="font-medium text-slate-700">{pageEnd - pageStart}</span> of{" "}
                <span className="font-medium text-slate-700">{totalRows}</span> enterprises
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }).map((_, idx) => {
                    const n = idx + 1
                    const active = n === safePage
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuery({ page: n })}
                        className={`h-7 w-7 rounded border text-xs transition ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  })}
                  {totalPages > 7 && <span className="px-1 text-xs text-slate-500">…</span>}
                </div>

                <div ref={limitMenuRef} className="relative">
                  <button
                    type="button"
                    onMouseDown={(ev) => ev.stopPropagation()}
                    onClick={(ev) => {
                      ev.stopPropagation()
                      setOpenLimitMenu((v) => !v)
                    }}
                    className="relative inline-flex items-center justify-between h-7 min-w-14 rounded border border-slate-200 bg-white px-2 text-xs leading-4 text-slate-700 hover:bg-slate-50"
                    aria-label="Rows per page"
                  >
                    <span>{limit}</span>
                    <ChevronDown
                      className={`w-3 h-3 ml-1 text-slate-500 transition-transform duration-150 ${
                        openLimitMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {openLimitMenu && (
                    <div className="absolute right-0 mt-2 w-14 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg z-50 p-1">
                      {[5, 10, 20, 50].map((n) => {
                        const active = n === limit
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setOpenLimitMenu(false)
                              setQuery({ limit: n, page: 1 })
                            }}
                            className={`w-full px-2 py-1.5 text-left text-[11px] leading-4 rounded-md transition ${
                              active
                                ? "bg-slate-100 text-slate-900"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex items-center justify-between">
                              <span>{n}</span>
                              {active && <Check className="w-3.5 h-3.5 text-slate-700" />}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action menu (fixed so it doesn't create scrollbars) */}
        {actionMenu && (
          <div
            ref={actionMenuElRef}
            style={{ left: actionMenu.left, top: actionMenu.top }}
            className="fixed z-[60] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            onClick={(ev) => ev.stopPropagation()}
          >
            <a
              href="#"
              onClick={(ev) => ev.preventDefault()}
              className="flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50"
              title="Edit page is not implemented yet"
            >
              Edit
            </a>

            {actionMenu.canApprove ? (
              <button
                type="button"
                disabled={pendingAccountId === actionMenu.accountId}
                onClick={() => void onUnlock(actionMenu.accountId)}
                className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 disabled:opacity-60"
              >
                Approve
              </button>
            ) : (
              <button
                type="button"
                disabled={pendingAccountId === actionMenu.accountId}
                onClick={() => void onLock(actionMenu.accountId)}
                className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 disabled:opacity-60"
              >
                Suspend
              </button>
            )}

            <button
              type="button"
              disabled
              className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-rose-600 hover:bg-slate-50 disabled:opacity-60"
              title="Delete API is not implemented yet"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

