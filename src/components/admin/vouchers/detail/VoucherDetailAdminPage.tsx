"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, Pencil, Percent, RotateCcw, Tag, Users } from "lucide-react"
import { useToast } from "@/contexts/toast-context"
import { approveAdminVoucher, getAdminVoucherDetail, rejectAdminVoucher } from "@/services/admin.service"
import type { AdminVoucherListItem } from "@/types/admin-api.types"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12px] leading-4 font-normal text-slate-500">{label}</div>
      <div className="mt-0.5 text-[13px] leading-4 font-medium text-slate-900">{value}</div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] leading-4 font-normal text-slate-500">{label}</div>
        <div className="mt-0.5 text-[18px] leading-6 font-semibold text-slate-900">{value}</div>
      </div>
    </div>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-[15px] leading-5 font-semibold text-slate-900">{title}</h2>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function statusPill(status: string) {
  if (status === "Approved") {
    return (
      <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
        Approved
      </span>
    )
  }
  if (status === "Rejected") {
    return (
      <span className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
        Rejected
      </span>
    )
  }
  if (status === "Expired") {
    return (
      <span className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-700 border border-slate-200">
        Expired
      </span>
    )
  }
  return (
    <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
      Pending
    </span>
  )
}

export default function VoucherDetailAdminPage({ voucherId }: { voucherId: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [voucher, setVoucher] = useState<AdminVoucherListItem | null>(null)
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminVoucherDetail(voucherId)
      setVoucher(res.voucher)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load voucher"
      showToast(message, "error", 4000)
      setVoucher(null)
    } finally {
      setLoading(false)
    }
  }, [showToast, voucherId])

  useEffect(() => {
    void load()
  }, [load])

  const discountLabel = useMemo(() => {
    if (!voucher) return "—"
    if (voucher.discountPercent != null) return `${voucher.discountPercent}%`
    if (voucher.discountAmount != null) return `$${voucher.discountAmount}`
    return "N/A"
  }, [voucher])

  const usageLabel = useMemo(() => {
    if (!voucher) return "—"
    const used = voucher.usedCount || 0
    const max = voucher.maxUsage
    return `${used} / ${max ?? "∞"}`
  }, [voucher])

  const expiresLabel = useMemo(() => {
    if (!voucher) return "—"
    return voucher.expiryDate ? new Date(voucher.expiryDate).toLocaleDateString("vi-VN") : "N/A"
  }, [voucher])

  const createdLabel = useMemo(() => {
    if (!voucher) return "—"
    return voucher.createdAt ? new Date(voucher.createdAt).toLocaleDateString("vi-VN") : "—"
  }, [voucher])

  const remainingLabel = useMemo(() => {
    if (!voucher) return "—"
    if (voucher.maxUsage == null) return "∞"
    const remaining = Math.max(0, voucher.maxUsage - (voucher.usedCount || 0))
    return String(remaining)
  }, [voucher])

  async function onApprove() {
    if (!voucher) return
    setPendingAction("approve")
    try {
      await approveAdminVoucher(voucher.id)
      showToast("Voucher approved", "success", 2500)
      await load()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to approve voucher"
      showToast(message, "error", 4000)
    } finally {
      setPendingAction(null)
    }
  }

  async function onReject() {
    if (!voucher) return
    setPendingAction("reject")
    try {
      await rejectAdminVoucher(voucher.id)
      showToast(voucher.status === "Approved" ? "Voucher disabled" : "Voucher rejected", "success", 2500)
      await load()
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update voucher"
      showToast(message, "error", 4000)
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/vouchers"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs leading-4 font-medium text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
          <h1 className="mt-2 text-[14px] leading-[18px] font-semibold text-[oklch(0.21_0.034_264.665)]">
            Voucher detail
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            View voucher information.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {voucher ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => router.push(`/admin/vouchers/${encodeURIComponent(voucher.id)}/edit`)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] leading-4 font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          ) : null}

          {voucher?.status === "Pending" ? (
            <>
              <button
                type="button"
                disabled={pendingAction != null || loading}
                onClick={() => void onApprove()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-[13px] leading-4 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={pendingAction != null || loading}
                onClick={() => void onReject()}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[13px] leading-4 font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                Reject
              </button>
            </>
          ) : null}

          {voucher?.status === "Rejected" ? (
            <button
              type="button"
              disabled={pendingAction != null || loading}
              onClick={() => void onApprove()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-[13px] leading-4 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Approve
            </button>
          ) : null}

          {voucher?.status === "Approved" ? (
            <button
              type="button"
              disabled={pendingAction != null || loading}
              onClick={() => void onReject()}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[13px] leading-4 font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              Disable
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] leading-4 font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-[13px] leading-4 text-slate-500">
          Loading…
        </div>
      ) : !voucher ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-[13px] leading-4 text-slate-500">
          Voucher not found.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <StatCard
              label="Discount"
              value={discountLabel}
              icon={Percent}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
            />
            <StatCard
              label="Usage"
              value={usageLabel}
              icon={Users}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
            />
            <StatCard
              label="Remaining"
              value={remainingLabel}
              icon={Tag}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              label="Expiry"
              value={expiresLabel}
              icon={Calendar}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
          </div>

          <InfoCard title="Voucher information">
            <Field label="Code" value={voucher.code} />
            <Field label="Status" value={statusPill(voucher.status)} />
            <Field label="Enterprise" value={voucher.enterpriseName ?? "—"} />
            <Field label="Created by" value={voucher.createdByLabel ?? "—"} />
            <Field label="Created at" value={createdLabel} />
            <Field label="Expiry date" value={expiresLabel} />
            <Field label="Min order value" value={voucher.minOrderValue != null ? `$${voucher.minOrderValue}` : "—"} />
            <Field label="Max usage" value={voucher.maxUsage ?? "Unlimited"} />
          </InfoCard>
        </div>
      )}
    </div>
  )
}

