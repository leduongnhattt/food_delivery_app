"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAdminSearchInput } from "@/hooks/use-admin-search-input"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  listAdminEnterpriseInvitations,
  resendEnterpriseInvitation,
  revokeEnterpriseInvitation,
  type AdminEnterpriseInvitationListItem,
} from "@/services/admin.service"
import { formatDate } from "@/lib/utils"
import { Ban, Check, ChevronDown, Eye, MoreVertical, Send, Search } from "lucide-react"
import { useToast } from "@/contexts/toast-context"

type Tab = "all" | "pending" | "accepted" | "expired" | "revoked"

export default function EnterprisesInvitationsAdminPage() {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  const tab = (currentSearchParams.get("status") || "all") as Tab
  const search = currentSearchParams.get("search")?.trim() || ""
  const page = Math.max(1, Number(currentSearchParams.get("page") || "1") || 1)
  const limit = Math.min(50, Math.max(5, Number(currentSearchParams.get("limit") || "10") || 10))
  const { showToast } = useToast()

  const [items, setItems] = useState<AdminEnterpriseInvitationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)
  const [openLimitMenu, setOpenLimitMenu] = useState(false)
  const limitMenuRef = useRef<HTMLDivElement | null>(null)
  const [actionMenu, setActionMenu] = useState<{
    invitationId: string
    email: string
    canResend: boolean
    canRevoke: boolean
    left: number
    top: number
  } | null>(null)
  const actionMenuElRef = useRef<HTMLDivElement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminEnterpriseInvitations({
        status: tab === "all" ? undefined : tab,
        search,
      })
      setItems(res.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invitations")
      setItems([])
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

      if (actionMenu) {
        const insideMenu =
          !!actionMenuElRef.current && !!target && actionMenuElRef.current.contains(target)
        const insideTrigger = !!target?.closest?.('[data-action-menu-trigger="true"]')
        if (!insideMenu && !insideTrigger) setActionMenu(null)
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

  function navigateInvitationsList(overrides: {
    status?: Tab
    search?: string
    page?: number
    limit?: number
  }) {
    const nextQuery = new URLSearchParams()
    const effectiveStatus = overrides.status ?? tab
    const trimmedSearch = (overrides.search ?? search).trim()
    const nextPage = Math.max(1, Number(overrides.page ?? page) || 1)
    const nextLimit = Math.min(50, Math.max(5, Number(overrides.limit ?? limit) || 10))
    if (effectiveStatus && effectiveStatus !== "all") nextQuery.set("status", effectiveStatus)
    if (trimmedSearch) nextQuery.set("search", trimmedSearch)
    if (nextPage !== 1) nextQuery.set("page", String(nextPage))
    if (nextLimit !== 10) nextQuery.set("limit", String(nextLimit))
    const queryString = nextQuery.toString()
    router.push(
      queryString
        ? `/admin/enterprises/invitations?${queryString}`
        : "/admin/enterprises/invitations",
    )
  }

  const { value: searchInput, onChange: onSearchChange } = useAdminSearchInput(
    search,
    (nextSearch) => navigateInvitationsList({ search: nextSearch, page: 1 }),
  )

  const statusLabel = useMemo(() => {
    if (tab === "pending") return "Pending"
    if (tab === "accepted") return "Actived"
    if (tab === "expired") return "Expired"
    if (tab === "revoked") return "Revoked"
    return "All Status"
  }, [tab])

  const stats = useMemo(() => {
    const total = items.length
    const activated = items.filter((x) => x.Status === "Accepted").length
    const pending = items.filter((x) => x.Status === "Pending").length
    const expiredOrRevoked = items.filter((x) => x.Status === "Expired" || x.Status === "Revoked").length
    return { total, activated, pending, expiredOrRevoked }
  }, [items])

  const statusBadge = useCallback((s: AdminEnterpriseInvitationListItem["Status"]) => {
    switch (s) {
      case "Accepted":
        return {
          label: "Actived",
          className:
            "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded bg-emerald-50 text-emerald-700",
        }
      case "Pending":
        return {
          label: "Pending",
          className:
            "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded bg-blue-100 text-blue-700",
        }
      case "Expired":
        return {
          label: "Expired",
          className:
            "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded bg-slate-100 text-slate-700",
        }
      case "Revoked":
        return {
          label: "Revoked",
          className: "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded text-rose-600",
        }
      default:
        return {
          label: s,
          className:
            "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded bg-slate-50 text-slate-700",
        }
    }
  }, [])

  async function onResend(invitationId: string) {
    setPendingId(invitationId)
    try {
      await resendEnterpriseInvitation(invitationId)
      showToast("Invitation resent", "success", 3000)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Resend failed", "error", 5000)
    } finally {
      setPendingId(null)
    }
  }

  async function onRevoke(invitationId: string) {
    setPendingId(invitationId)
    try {
      await revokeEnterpriseInvitation(invitationId)
      showToast("Invitation revoked", "success", 3000)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Revoke failed", "error", 5000)
    } finally {
      setPendingId(null)
    }
  }

  const totalRows = items.length
  const totalPages = Math.max(1, Math.ceil(totalRows / limit))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * limit
  const pageEnd = Math.min(totalRows, pageStart + limit)
  const visibleRows = useMemo(
    () => items.slice(pageStart, pageEnd),
    [items, pageStart, pageEnd],
  )

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-[14px] leading-[18px] font-semibold text-[oklch(0.21_0.034_264.665)]">
              Enterprise Invitations
            </h1>
            <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
              Send and manage invitations for enterprises to join the platform.
            </p>
          </div>
          <Link
            href="/admin/enterprises/invitations/send"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-[13px] leading-4 font-medium text-white hover:bg-blue-700"
          >
            + Send invitation
          </Link>
        </div>

        {/* Search & filter (card) */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="w-full flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full h-8 min-h-8 py-0 border-0 appearance-none placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 gap-2 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 ps-10 text-[13px] leading-normal ring-slate-200 bg-white"
                  placeholder="Search by email or enterprise name"
                  value={searchInput}
                  onChange={onSearchChange}
                  aria-label="Search invitations"
                />
              </div>
            </div>

            <div className="w-full shrink-0 sm:w-40">
              <div ref={statusMenuRef} className="relative">
                <button
                  type="button"
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => {
                    ev.stopPropagation()
                    setOpenStatusMenu((v) => !v)
                  }}
                  className="relative group inline-flex h-8 min-h-8 items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] md:text-[13px] px-3 py-0 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 disabled:bg-white focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200 w-full"
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
                    {(
                      [
                        { id: "all", label: "All Status" },
                        { id: "pending", label: "Pending" },
                        { id: "accepted", label: "Actived" },
                        { id: "expired", label: "Expired" },
                        { id: "revoked", label: "Revoked" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setOpenStatusMenu(false)
                          navigateInvitationsList({ status: opt.id })
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                      >
                        <span>{opt.label}</span>
                        {tab === opt.id && <Check className="w-4 h-4 text-slate-700" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Monitor (green info bar like CMS) */}
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-900">
          Track invitation status and manage pending, accepted, expired, and revoked invitations.
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-gray-500 font-medium">Total Invitations</p>
            <p className="text-xl font-semibold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-gray-500 font-medium">Actived</p>
            <p className="text-xl font-semibold text-gray-900">{stats.activated}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-gray-500 font-medium">Pending</p>
            <p className="text-xl font-semibold text-gray-900">{stats.pending}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-gray-500 font-medium">Expired / Revoked</p>
            <p className="text-xl font-semibold text-gray-900">{stats.expiredOrRevoked}</p>
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
              <table className="min-w-full text-[13px]">
                <thead>
                  <tr className="bg-[#f9fbfc] text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Invitation ID
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Email
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Enterprise name
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Sent By
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Sent At
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Expires
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Status
                    </th>
                    <th className="py-2 pr-0 text-right w-20 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map((it) => (
                    <tr key={it.InvitationID}>
                      <td className="py-2 pr-4 text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                        {String(it.InvitationID).slice(0, 10)}
                      </td>
                      <td className="py-2 pr-4 text-[12px] leading-4 font-medium text-[oklch(0.21_0.034_264.665)]">
                        {it.Email}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">
                        {it.EnterpriseNameDraft || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">Admin</td>
                      <td className="py-2 pr-4 text-slate-700">
                        {formatDate(String(it.CreatedAt))}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">
                        {formatDate(String(it.ExpiresAt))}
                      </td>
                      <td className="py-2 pr-4">
                        {(() => {
                          const b = statusBadge(it.Status)
                          return <span className={b.className}>{b.label}</span>
                        })()}
                      </td>
                      <td className="py-2 pr-0 text-right w-20">
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
                              cur?.invitationId === it.InvitationID
                                ? null
                                : {
                                    invitationId: it.InvitationID,
                                    email: it.Email,
                                    canResend:
                                      it.Status === "Pending" || it.Status === "Expired",
                                    canRevoke: it.Status === "Pending",
                                    left,
                                    top,
                                  },
                            )
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition"
                          aria-label="Actions"
                          data-action-menu-trigger="true"
                        >
                          <MoreVertical className="w-4 h-4 text-slate-700" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && items.length === 0 && (
              <div className="text-center text-slate-500 py-10">No invitations</div>
            )}
          </div>

          {/* Table footer pagination (UI like CMS) */}
          {!loading && totalRows > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
              <div className="text-[13px] font-medium text-slate-500">
                Showing <span className="font-medium text-slate-700">{pageEnd - pageStart}</span> of{" "}
                <span className="font-medium text-slate-700">{totalRows}</span> invitations
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
                        onClick={() => navigateInvitationsList({ page: n })}
                        className={`h-7 w-7 rounded border text-[13px] font-medium transition ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    )
                  })}
                  {totalPages > 7 && (
                    <>
                      <span className="px-1 text-[13px] text-slate-500">…</span>
                      <button
                        type="button"
                        onClick={() => navigateInvitationsList({ page: totalPages })}
                        className={`h-7 w-7 rounded border text-[13px] font-medium transition ${
                          totalPages === safePage
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => navigateInvitationsList({ page: Math.min(totalPages, safePage + 1) })}
                    className="h-7 w-7 rounded border text-[13px] font-medium bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    aria-label="Next page"
                  >
                    ›
                  </button>
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
                      {[10, 20, 50].map((n) => {
                        const active = n === limit
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => {
                              setOpenLimitMenu(false)
                              navigateInvitationsList({ limit: n, page: 1 })
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
            <Link
              href={`/admin/enterprises/invitations/${encodeURIComponent(actionMenu.invitationId)}`}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" />
              View
            </Link>
            {actionMenu.canResend && (
              <button
                type="button"
                disabled={pendingId === actionMenu.invitationId}
                onClick={() => void onResend(actionMenu.invitationId)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                Resend
              </button>
            )}
            {actionMenu.canRevoke && (
              <button
                type="button"
                disabled={pendingId === actionMenu.invitationId}
                onClick={() => void onRevoke(actionMenu.invitationId)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[12px] leading-4 font-normal text-rose-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <Ban className="w-4 h-4" />
                Revoke
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

