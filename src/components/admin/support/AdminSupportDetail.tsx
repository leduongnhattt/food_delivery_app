"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  ChevronDown,
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
import {
  ADMIN_MENU_TRIGGER_CLASS,
} from "@/components/admin/shared/admin-field-classes"

const STATUS_OPTIONS = [
  { value: "Pending", label: "Pending" },
  { value: "InProgress", label: "In progress" },
  { value: "Resolved", label: "Resolved" },
  { value: "Closed", label: "Closed" },
] as const

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
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)

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

  useEffect(() => {
    if (!openStatusMenu) return
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null
      if (statusMenuRef.current && t && !statusMenuRef.current.contains(t)) {
        setOpenStatusMenu(false)
      }
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [openStatusMenu])

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
        <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-600">Ticket not found.</p>
        <Link
          href="/admin/support"
          className="mt-4 inline-block text-[#2563FF] font-medium hover:underline"
        >
          Back to inbox
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => router.push("/admin/support")}
        className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-600 hover:text-[#2563FF] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500">Ticket details</div>
            <h1 className="mt-1 text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
              {ticket.subject}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                <span className="break-all">{ticket.id}</span>
              </span>
              <SupportStatusBadge status={ticket.status} />
              <SupportCategoryLabel category={ticket.category} />
            </div>
          </div>

          <div ref={statusMenuRef} className="relative shrink-0 w-[190px]">
            <button
              type="button"
              onMouseDown={(ev) => ev.stopPropagation()}
              onClick={(ev) => {
                ev.stopPropagation()
                setOpenStatusMenu((v) => !v)
              }}
              className={ADMIN_MENU_TRIGGER_CLASS}
              aria-label="Status"
              aria-haspopup="menu"
              aria-expanded={openStatusMenu}
            >
              <span className="truncate">
                {STATUS_OPTIONS.find((x) => x.value === ticket.status)?.label ?? ticket.status}
              </span>
              <ChevronDown
                className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                  openStatusMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {openStatusMenu ? (
              <div
                onClick={(ev) => ev.stopPropagation()}
                className="absolute right-0 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setOpenStatusMenu(false)
                      void handleStatus(opt.value)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                  >
                    <span>{opt.label}</span>
                    {ticket.status === opt.value ? (
                      <Check className="w-4 h-4 text-slate-700" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="text-[12px] font-semibold text-slate-700">Requester</div>
            <div className="space-y-1">
              <div className="text-[12px] font-medium text-slate-800">
                {ticket.requesterUsername}
              </div>
              <div className="text-[12px] text-slate-600">{ticket.requesterEmail}</div>
              {ticket.assignedTo ? (
                <div className="text-[12px] text-slate-500">
                  Assigned:{" "}
                  <span className="font-medium text-slate-700">{ticket.assignedTo}</span>
                </div>
              ) : null}
            </div>

            {!ticket.assignedAdminId ? (
              <button
                type="button"
                onClick={() => void handleClaim()}
                disabled={claiming}
                className="inline-flex h-8 min-h-8 items-center gap-2 rounded border border-[#2563FF] bg-[#2563FF] px-3 py-0 text-[12px] font-medium text-white hover:bg-[#1E4FE6] disabled:opacity-60 transition-colors"
              >
                {claiming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Claim ticket
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-[12px] font-semibold text-slate-700">Original message</div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-slate-800 whitespace-pre-wrap text-[12px] leading-5">
              {ticket.messages?.find((m) => m.sender !== "Admin")?.body ||
                ticket.description ||
                "—"}
            </div>
            <div className="text-[11px] text-slate-500">
              Sent {formatDate(ticket.sentAt)}
              {ticket.updatedAt ? ` · Updated ${formatDate(ticket.updatedAt)}` : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Message history */}
      {ticket.messages && ticket.messages.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="px-4 py-3 text-[12px] font-semibold text-slate-700">
            Message history
          </div>
          <div className="border-t border-slate-100 px-4 py-3 space-y-3">
            {ticket.messages.map((m) => {
              const isAdmin = m.sender === "Admin"
              return (
                <div
                  key={m.id}
                  className={
                    isAdmin
                      ? "rounded-lg border border-emerald-100 bg-emerald-50/40 p-4"
                      : "rounded-lg border border-slate-200 bg-slate-50 p-4"
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {isAdmin ? "Admin" : "User"}
                    </div>
                    <div className="text-[11px] text-slate-500">{formatDate(m.createdAt)}</div>
                  </div>
                  <div className="mt-2 text-slate-800 whitespace-pre-wrap text-[12px] leading-5">
                    {m.body}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {/* Reply */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 py-3 text-[12px] font-semibold text-slate-700">Reply to user</div>
        <div className="border-t border-slate-100 px-4 py-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            placeholder="Type your response…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] leading-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <div className="mt-3 flex items-center justify-end">
            <button
              type="button"
              onClick={() => void handleReply()}
              disabled={sending || !reply.trim()}
              className="inline-flex h-8 min-h-8 items-center gap-2 rounded border border-[#2563FF] bg-[#2563FF] px-4 py-0 text-[12px] font-medium text-white hover:bg-[#1E4FE6] disabled:opacity-50 transition-colors"
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
