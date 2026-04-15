"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Headphones, Loader2, RefreshCw, Search } from "lucide-react"
import { fetchAdminSupportTickets } from "@/services/admin-support.service"
import type { AdminSupportTicketListItem } from "@/types/support-api.types"
import { formatDate } from "@/lib/utils"
import {
  SUPPORT_CATEGORY_FILTER_OPTIONS,
  SupportCategoryLabel,
  SupportStatusBadge,
} from "@/components/support/support-ui"
import { useToast } from "@/contexts/toast-context"

const STATUS_FILTER = [
  { value: "", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "InProgress", label: "In progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
]

export default function AdminSupportList() {
  const { showToast } = useToast()
  const [tickets, setTickets] = useState<AdminSupportTicketListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const queryKey = useMemo(
    () => `${status}::${category}::${from}::${to}`,
    [status, category, from, to],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAdminSupportTickets({
        status: status || undefined,
        category: category || undefined,
        from: from || undefined,
        to: to || undefined,
      })
      setTickets(res.tickets ?? [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load tickets"
      showToast(msg, "error", 4000)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [showToast, status, category, from, to])

  useEffect(() => {
    void load()
  }, [load, queryKey])

  const pendingCount = tickets.filter((t) => t.status === "Pending").length

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6 md:p-8 text-white shadow-lg">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Headphones className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Support inbox
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-xl">
                Review and respond to customer and business requests. Replies
                notify users by email.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:w-[190px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-xs font-semibold text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {STATUS_FILTER.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative w-full sm:w-[210px]">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {SUPPORT_CATEGORY_FILTER_OPTIONS.map((o) => (
              <option key={o.value || 'all-cat'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            ▼
          </span>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="w-full sm:w-[160px]">
            <label className="sr-only" htmlFor="support-from-date">
              From
            </label>
            <input
              id="support-from-date"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="w-full sm:w-[160px]">
            <label className="sr-only" htmlFor="support-to-date">
              To
            </label>
            <input
              id="support-to-date"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="flex justify-center py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            No tickets match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 line-clamp-2">
                        {t.subject}
                      </div>
                      {t.hasReply && (
                        <span className="text-xs text-emerald-600 font-medium">
                          Replied
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="font-medium text-slate-800">
                        {t.requesterUsername}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[180px]">
                        {t.requesterEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SupportCategoryLabel category={t.category} />
                    </td>
                    <td className="px-4 py-3">
                      <SupportStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatDate(t.sentAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/support/${encodeURIComponent(t.id)}`}
                        className="inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && tickets.length > 0 && (
        <p className="text-center text-xs text-slate-500">
          {pendingCount > 0 && (
            <span className="font-medium text-amber-700">
              {pendingCount} pending
            </span>
          )}
          {pendingCount > 0 && " · "}
          {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} shown
        </p>
      )}
    </div>
  )
}
