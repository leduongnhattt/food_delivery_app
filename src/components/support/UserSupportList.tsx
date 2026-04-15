"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Headphones,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  X,
} from "lucide-react"
import {
  createUserSupportTicket,
  fetchUserSupportTickets,
} from "@/services/user-support.service"
import type { UserSupportTicketSummary } from "@/types/support-api.types"
import { formatDate } from "@/lib/utils"
import {
  SUPPORT_CATEGORY_CREATE_OPTIONS,
  SupportCategoryLabel,
  SupportStatusBadge,
} from "@/components/support/support-ui"
import { useToast } from "@/contexts/toast-context"
import { EnterprisePageHeader } from "@/components/enterprise/EnterprisePageHeader"

const STATUS_FILTER = [
  { value: "", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "InProgress", label: "In progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
]

export default function UserSupportList({
  basePath,
  title = "Support",
  subtitle = "Create a ticket for help with orders, your account, or your shop. We reply by email when staff responds.",
  headerVariant = "default",
}: {
  basePath: string
  title?: string
  subtitle?: string
  /** `"admin"` uses compact title/subtitle like admin CMS pages. */
  headerVariant?: "default" | "admin"
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const [tickets, setTickets] = useState<UserSupportTicketSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("General")
  const [submitting, setSubmitting] = useState(false)

  const queryKey = useMemo(() => status, [status])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchUserSupportTickets({
        status: status || undefined,
      })
      setTickets(res.tickets ?? [])
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load tickets"
      showToast(msg, "error", 4000)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [showToast, status])

  useEffect(() => {
    void load()
  }, [load, queryKey])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const s = subject.trim()
    const d = description.trim()
    if (s.length < 3) {
      showToast("Subject must be at least 3 characters", "error", 3500)
      return
    }
    if (d.length < 5) {
      showToast("Description must be at least 5 characters", "error", 3500)
      return
    }
    setSubmitting(true)
    try {
      const res = await createUserSupportTicket({
        subject: s,
        description: d,
        category,
      })
      showToast("Ticket created", "success", 3000)
      setModalOpen(false)
      setSubject("")
      setDescription("")
      setCategory("General")
      if (res.ticketId) {
        router.push(
          `${basePath.replace(/\/$/, "")}/${encodeURIComponent(res.ticketId)}`,
        )
        return
      }
      await load()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not create ticket",
        "error",
        4000,
      )
    } finally {
      setSubmitting(false)
    }
  }

  const base = basePath.replace(/\/$/, "")

  const headerActions = (
    <>
      <button
        type="button"
        onClick={() => void load()}
        disabled={loading}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-medium text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Refresh
      </button>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-sky-600 px-4 text-[13px] font-medium text-white shadow-sm transition hover:bg-sky-700"
      >
        <MessageSquarePlus className="h-4 w-4" />
        New ticket
      </button>
    </>
  )

  return (
    <div className="space-y-6">
      {headerVariant === "admin" ? (
        <EnterprisePageHeader title={title} description={subtitle} actions={headerActions} />
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-900 p-6 md:p-8 text-white shadow-lg">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <Headphones className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
                <p className="mt-1 max-w-xl text-sm text-slate-300">{subtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-900 shadow-md transition hover:bg-slate-100"
              >
                <MessageSquarePlus className="h-4 w-4" />
                New ticket
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md">
        <label className="sr-only" htmlFor="support-status-filter">
          Status
        </label>
        <select
          id="support-status-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-medium text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          {STATUS_FILTER.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading && tickets.length === 0 ? (
          <div className="flex justify-center py-20 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 px-6 text-center text-slate-500">
            <p className="font-medium text-slate-700">No tickets yet</p>
            <p className="mt-1 text-sm">
              When you open a request, it will appear here.
            </p>
          </div>
        ) : (
          <ul className="p-4 space-y-3 bg-slate-50/30">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link
                  href={`${base}/${encodeURIComponent(t.id)}`}
                  className="group block rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:shadow-md hover:border-slate-300"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-700 transition-colors">
                        {t.subject}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <SupportCategoryLabel category={t.category} />
                        <SupportStatusBadge status={t.status} />
                        {t.hasReply && (
                          <span className="text-xs font-medium text-emerald-600">
                            Staff replied
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap sm:text-right">
                      {formatDate(t.sentAt)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-ticket-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2
                id="new-ticket-title"
                className="text-lg font-semibold text-slate-900"
              >
                New support ticket
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 px-5 py-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {SUPPORT_CATEGORY_CREATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Short summary (min 3 characters)"
                  minLength={3}
                  maxLength={200}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="What do you need help with? (min 5 characters)"
                  minLength={5}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
