"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Hash,
  Send,
  UserCheck,
} from "lucide-react"
import {
  claimAdminSupportTicket,
  fetchAdminSupportTicket,
  patchAdminSupportTicketStatus,
  replyAdminSupportTicket,
} from "@/services/admin-support.service"
import type { AdminSupportTicketDetail } from "@/types/support-api.types"
import { formatDate } from "@/lib/utils"
import {
  SupportCategoryLabel,
  SupportStatusBadge,
} from "@/components/support/support-ui"
import { useToast } from "@/contexts/toast-context"

export default function AdminSupportDetail() {
  const params = useParams()
  const router = useRouter()
  const ticketId = typeof params?.ticketId === "string" ? params.ticketId : ""
  const { showToast } = useToast()

  const [ticket, setTicket] = useState<AdminSupportTicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [claiming, setClaiming] = useState(false)

  const load = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const res = await fetchAdminSupportTicket(ticketId)
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

  async function handleClaim() {
    if (!ticketId) return
    setClaiming(true)
    try {
      await claimAdminSupportTicket(ticketId)
      showToast("Ticket claimed", "success", 3000)
      await load()
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Could not claim",
        "error",
        4000,
      )
    } finally {
      setClaiming(false)
    }
  }

  async function handleReply() {
    const text = reply.trim()
    if (!text || !ticketId) return
    setSending(true)
    try {
      await replyAdminSupportTicket(ticketId, text)
      setReply("")
      showToast("Reply sent — user will be notified by email", "success", 4000)
      await load()
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Failed to send reply",
        "error",
        4000,
      )
    } finally {
      setSending(false)
    }
  }

  async function handleStatus(next: string) {
    if (!ticketId) return
    try {
      await patchAdminSupportTicketStatus(ticketId, next)
      showToast("Status updated", "success", 3000)
      await load()
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Update failed",
        "error",
        4000,
      )
    }
  }

  if (loading && !ticket) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-600">Ticket not found.</p>
        <Link
          href="/admin/support"
          className="mt-4 inline-block text-indigo-600 font-medium hover:underline"
        >
          Back to inbox
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        type="button"
        onClick={() => router.push("/admin/support")}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to inbox
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50/50 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {ticket.subject}
              </h1>
              <div className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                <Hash className="h-3.5 w-3.5" />
                <span className="break-all">Ticket ID: {ticket.id}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SupportStatusBadge status={ticket.status} />
                <SupportCategoryLabel category={ticket.category} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={ticket.status}
                onChange={(e) => void handleStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {["Pending", "InProgress", "Resolved", "Closed"].map((s) => (
                  <option key={s} value={s}>
                    {s === "InProgress" ? "In progress" : s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Requester
            </h2>
            <p className="font-medium text-slate-900">{ticket.requesterUsername}</p>
            <p className="text-sm text-slate-600">{ticket.requesterEmail}</p>
            {ticket.assignedTo && (
              <p className="text-sm text-slate-500 mt-1">
                Assigned: <span className="font-medium text-slate-700">{ticket.assignedTo}</span>
              </p>
            )}
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Original message
            </h2>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-slate-800 whitespace-pre-wrap text-sm leading-relaxed">
              {ticket.messages?.find((m) => m.sender !== "Admin")?.body ||
                ticket.description ||
                "—"}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sent {formatDate(ticket.sentAt)}
              {ticket.updatedAt && ` · Updated ${formatDate(ticket.updatedAt)}`}
            </p>
          </div>

          {ticket.messages && ticket.messages.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Message history
              </h2>
              <div className="space-y-3">
                {ticket.messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.sender === "Admin"
                        ? "rounded-xl border border-emerald-100 bg-emerald-50/50 p-4"
                        : "rounded-xl border border-slate-200 bg-slate-50 p-4"
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {m.sender === "Admin" ? "Admin" : "User"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatDate(m.createdAt)}
                      </div>
                    </div>
                    <div className="mt-2 text-slate-800 whitespace-pre-wrap text-sm">
                      {m.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-5">
            {!ticket.assignedAdminId && (
              <button
                type="button"
                onClick={() => void handleClaim()}
                disabled={claiming}
                className="mb-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-60"
              >
                {claiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Claim ticket
              </button>
            )}

            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Reply to user
            </h2>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              placeholder="Type your response…"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-inner placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="button"
              onClick={() => void handleReply()}
              disabled={sending || !reply.trim()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send reply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
