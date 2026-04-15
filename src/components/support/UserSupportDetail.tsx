"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Headphones,
  Loader2,
  Pencil,
  Trash2,
  X,
  Save,
  Hash,
  CalendarClock,
} from "lucide-react"
import {
  deleteUserSupportTicket,
  fetchUserSupportTicket,
  patchUserSupportTicket,
} from "@/services/user-support.service"
import type { UserSupportTicketDetail } from "@/types/support-api.types"
import { formatDate } from "@/lib/utils"
import {
  SUPPORT_CATEGORY_CREATE_OPTIONS,
  SupportCategoryLabel,
  SupportStatusBadge,
} from "@/components/support/support-ui"
import { useToast } from "@/contexts/toast-context"

export default function UserSupportDetail({ basePath }: { basePath: string }) {
  const params = useParams()
  const router = useRouter()
  const ticketId =
    typeof params?.ticketId === "string" ? params.ticketId : ""
  const { showToast } = useToast()
  const [ticket, setTicket] = useState<UserSupportTicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("General")

  const base = basePath.replace(/\/$/, "")

  const load = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const res = await fetchUserSupportTicket(ticketId)
      setTicket(res.ticket)
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Failed to load ticket",
        "error",
        4000,
      )
      setTicket(null)
    } finally {
      setLoading(false)
    }
  }, [ticketId, showToast])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!ticket) return
    setSubject(ticket.subject || "")
    setDescription(ticket.description || "")
    setCategory(ticket.category || "General")
  }, [ticket])

  if (loading && !ticket) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Ticket not found.</p>
        <Link
          href={base}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to support
        </Link>
      </div>
    )
  }

  const isPending = ticket.status === "Pending"

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!ticketId) return
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
    setSaving(true)
    try {
      await patchUserSupportTicket(ticketId, {
        subject: s,
        description: d,
        category,
      })
      showToast("Ticket updated", "success", 3000)
      setEditOpen(false)
      await load()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not update ticket",
        "error",
        4000,
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!ticketId) return
    setDeleteOpen(true)
  }

  async function confirmDelete() {
    if (!ticketId) return
    setDeleting(true)
    try {
      await deleteUserSupportTicket(ticketId)
      showToast("Ticket deleted", "success", 3000)
      router.push(base)
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not delete ticket",
        "error",
        4500,
      )
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href={base}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        All tickets
      </Link>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-emerald-950 via-teal-900 to-sky-900 p-6 text-white shadow-lg md:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute -bottom-10 left-1/3 h-40 w-40 rounded-full bg-sky-400/10 blur-2xl" />
        <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Headphones className="h-6 w-6 text-cyan-300" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-bold tracking-tight md:text-2xl line-clamp-2">
                  {ticket.subject}
                </h1>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-200/80">
                      Category
                    </span>
                    <SupportCategoryLabel category={ticket.category} />
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 backdrop-blur">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-200/80">
                      Status
                    </span>
                    <SupportStatusBadge status={ticket.status} />
                  </div>

                  {!ticket.replyMessage && (
                    <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-100 ring-1 ring-inset ring-cyan-400/20">
                      Waiting for reply
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-xs text-slate-200/90 sm:grid-cols-2">
                <div className="inline-flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10">
                  <Hash className="mt-0.5 h-3.5 w-3.5 text-slate-200/70" />
                  <span className="break-all">
                    <span className="font-semibold text-slate-100">Ticket ID:</span>{" "}
                    {ticket.id}
                  </span>
                </div>
                <div className="inline-flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10">
                  <CalendarClock className="mt-0.5 h-3.5 w-3.5 text-slate-200/70" />
                  <span className="whitespace-normal">
                    <span className="font-semibold text-slate-100">Sent:</span>{" "}
                    {formatDate(ticket.sentAt)}
                    {ticket.updatedAt ? (
                      <>
                        <br />
                        <span className="font-semibold text-slate-100">
                          Updated:
                        </span>{" "}
                        {formatDate(ticket.updatedAt)}
                      </>
                    ) : null}
                  </span>
                </div>
              </div>

              {ticket.assignedTo && (
                <p className="mt-3 text-xs text-slate-200/90">
                  Assigned to{" "}
                  <span className="font-semibold text-white">
                    {ticket.assignedTo}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-2 lg:flex-col lg:items-stretch lg:justify-start">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              disabled={!isPending}
              className="inline-flex w-32 justify-center items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                isPending ? "Edit ticket" : "Only pending tickets can be edited"
              }
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="inline-flex w-32 justify-center items-center gap-2 rounded-xl bg-rose-500/90 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-500 disabled:opacity-60"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <section className="rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900/70">
            Your message
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
            {ticket.description ?? "—"}
          </p>
        </section>

        <section className="rounded-2xl border border-indigo-200/70 bg-indigo-50/50 p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-900/80">
            Support reply
          </h2>
          {ticket.replyMessage ? (
            <p className="mt-3 whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">
              {ticket.replyMessage}
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              No reply yet. You will receive an email when our team responds.
            </p>
          )}
          {ticket.assignedTo && (
            <p className="mt-4 text-xs text-slate-500">
              Handled by:{" "}
              <span className="font-medium text-slate-700">
                {ticket.assignedTo}
              </span>
            </p>
          )}
        </section>
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-ticket-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="edit-ticket-title"
                    className="text-lg font-semibold text-slate-900"
                  >
                    Edit ticket
                  </h2>
                  <p className="text-xs text-slate-500">
                    Only pending tickets can be edited.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 px-5 py-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  disabled={!isPending}
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
                  minLength={3}
                  maxLength={200}
                  required
                  disabled={!isPending}
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
                  minLength={5}
                  required
                  disabled={!isPending}
                />
              </div>

              {!isPending && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900/80">
                  This ticket is no longer pending, so editing is disabled.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={deleting ? undefined : () => setDeleteOpen(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
            <div className="bg-gradient-to-r from-rose-600 to-rose-500 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Delete ticket</h3>
                  <p className="text-sm text-rose-100">
                    This action cannot be undone.
                  </p>
                </div>
                {!deleting && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(false)}
                    className="text-white/80 hover:text-white text-xl leading-none"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                Are you sure you want to delete this ticket?
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-semibold text-slate-700">
                  Ticket subject
                </div>
                <div className="mt-1 text-slate-700 line-clamp-2">
                  {ticket.subject}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
