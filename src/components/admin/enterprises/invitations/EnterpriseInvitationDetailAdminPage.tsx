"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowLeft,
  Ban,
  Calendar,
  Clock,
  Copy,
  Mail,
  Phone,
  Send,
  User,
} from "lucide-react"
import {
  getAdminEnterpriseInvitationDetail,
  resendEnterpriseInvitation,
  revokeEnterpriseInvitation,
} from "@/services/admin.service"
import type {
  AdminEnterpriseInvitationDetailResponse,
  AdminEnterpriseInvitationStatus,
} from "@/types/admin-api.types"
import { useToast } from "@/contexts/toast-context"

function formatDetailAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function statusHeaderBadge(status: AdminEnterpriseInvitationStatus) {
  switch (status) {
    case "Pending":
      return "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded bg-blue-100 text-blue-700"
    case "Accepted":
      return "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded bg-emerald-50 text-emerald-700"
    case "Expired":
      return "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded bg-slate-100 text-slate-700"
    case "Revoked":
      return "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded text-rose-600"
    default:
      return "font-medium inline-flex items-center text-xs px-2 py-1 gap-1 rounded bg-slate-100 text-slate-700"
  }
}

function statusLabel(status: AdminEnterpriseInvitationStatus) {
  if (status === "Accepted") return "Actived"
  if (status === "Pending") return "Pending"
  return status
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] leading-4 font-normal text-slate-500">{label}</div>
        <div className="mt-0.5 text-[13px] leading-4 font-medium text-slate-900 break-all">{value}</div>
      </div>
    </div>
  )
}

export default function EnterpriseInvitationDetailAdminPage({
  invitationId,
}: {
  invitationId: string
}) {
  const { showToast } = useToast()
  const [data, setData] = useState<AdminEnterpriseInvitationDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminEnterpriseInvitationDetail(invitationId)
      setData(res)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to load invitation", "error", 5000)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [invitationId, showToast])

  useEffect(() => {
    void load()
  }, [load])

  const onCopyLink = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.inviteLinkMasked)
      showToast("Copied to clipboard", "success", 2000)
    } catch {
      showToast("Could not copy", "error", 3000)
    }
  }

  const onResend = async () => {
    if (!data) return
    setPending(true)
    try {
      await resendEnterpriseInvitation(data.invitation.InvitationID)
      showToast("Invitation resent", "success", 3000)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Resend failed", "error", 5000)
    } finally {
      setPending(false)
    }
  }

  const onRevoke = async () => {
    if (!data) return
    setPending(true)
    try {
      await revokeEnterpriseInvitation(data.invitation.InvitationID)
      showToast("Invitation revoked", "success", 3000)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Revoke failed", "error", 5000)
    } finally {
      setPending(false)
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-[13px] leading-4 text-slate-500">Loading…</div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/enterprises/invitations"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invitations
        </Link>
        <p className="text-sm text-slate-600">Invitation not found.</p>
      </div>
    )
  }

  const { invitation, inviteLinkMasked, sentByLabel, timeline, quickStats } = data
  const isPending = invitation.Status === "Pending"
  const isExpiredStatus = invitation.Status === "Expired"
  const canResend = isPending || isExpiredStatus
  const canRevoke = isPending

  const enterpriseName =
    invitation.EnterpriseNameDraft?.trim() || invitation.Email.split("@")[0] || "—"

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <Link
          href="/admin/enterprises/invitations"
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Invitations
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="text-[18px] leading-6 font-bold text-slate-900">Invitation Details</h1>
            <span className={statusHeaderBadge(invitation.Status)}>{statusLabel(invitation.Status)}</span>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {canResend && (
              <button
                type="button"
                disabled={pending}
                onClick={() => void onResend()}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Resend invitation
              </button>
            )}
            {canRevoke && (
              <button
                type="button"
                disabled={pending}
                onClick={() => void onRevoke()}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-500 bg-white px-4 text-[12px] font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Revoke invitation
              </button>
            )}
          </div>
        </div>

        <p className="font-mono text-[12px] leading-4 text-slate-500 break-all">
          {invitation.InvitationID}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-[15px] leading-5 font-semibold text-slate-900 mb-5">
              Invitation information
            </h2>
            <div className="space-y-5">
              <InfoRow icon={Mail} label="Email" value={invitation.Email} />
              <InfoRow icon={Phone} label="Mobile number" value={invitation.PhoneNumber} />
              <InfoRow icon={User} label="Enterprise name" value={enterpriseName} />
              <InfoRow
                icon={Calendar}
                label="Sent on"
                value={formatDetailAt(invitation.CreatedAt)}
              />
              <InfoRow
                icon={Clock}
                label="Expires on"
                value={formatDetailAt(invitation.ExpiresAt)}
              />
              <InfoRow icon={User} label="Sent by" value={sentByLabel} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-[15px] leading-5 font-semibold text-slate-900 mb-3">
              Invitation link
            </h2>
            <p className="text-[12px] leading-4 text-slate-500 mb-3">
              The full secure token is only included in the email. Use{" "}
              <span className="font-medium text-slate-700">Resend invitation</span> to mail a fresh
              link. You can copy the URL pattern below for reference.
            </p>
            <div className="flex items-stretch gap-2 rounded-lg border border-slate-200 bg-slate-50">
              <div className="min-w-0 flex-1 px-3 py-2.5 text-[12px] leading-4 text-slate-700 break-all">
                {inviteLinkMasked}
              </div>
              <button
                type="button"
                onClick={() => void onCopyLink()}
                className="shrink-0 border-l border-slate-200 px-3 text-slate-600 hover:bg-slate-100 rounded-r-lg"
                aria-label="Copy link"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-[15px] leading-5 font-semibold text-slate-900 mb-5">
              Activity timeline
            </h2>
            <div className="relative pl-4 border-l border-slate-200 space-y-6">
              {timeline.map((ev, i) => (
                <div key={`${ev.at}-${ev.title}-${i}`} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="text-[13px] leading-4 font-semibold text-slate-900">{ev.title}</div>
                  <div className="mt-1 text-[12px] leading-4 text-slate-500">
                    {formatDetailAt(ev.at)}
                    <span className="text-slate-400"> · </span>
                    <span>by {ev.by}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-[15px] leading-5 font-semibold text-slate-900 mb-4">Quick stats</h2>
            <div className="space-y-3 text-[13px] leading-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Email opens</span>
                <span className="font-medium text-slate-900">{quickStats.emailOpens}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Link clicks</span>
                <span className="font-medium text-slate-900">{quickStats.linkClicks}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Days since sent</span>
                <span className="font-medium text-slate-900">{quickStats.daysSinceSent}</span>
              </div>
              {quickStats.daysFromSentToFirstEmailOpen !== null ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Days to first email open</span>
                  <span className="font-medium text-slate-900">
                    {quickStats.daysFromSentToFirstEmailOpen}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
