"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Building2,
  DollarSign,
  FileText,
  Package,
  Percent,
  RotateCcw,
  ShoppingBag,
  Star,
} from "lucide-react"
import { formatDate, formatPriceCompact } from "@/lib/utils"
import {
  getAdminEnterpriseDetail,
  lockAdminEnterpriseAccount,
  unlockAdminEnterpriseAccount,
} from "@/services/admin.service"
import type { AdminEnterpriseDetailResponse } from "@/types/admin-api.types"
import { useToast } from "@/contexts/toast-context"

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function Field({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <div className="text-[12px] leading-4 font-normal text-slate-500">{label}</div>
      <div className="mt-0.5 text-[13px] leading-4 font-medium text-slate-900">{value}</div>
    </div>
  )
}

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-[15px] leading-5 font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">{children}</div>
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

export default function EnterpriseDetailAdminPage({
  enterpriseId,
}: {
  enterpriseId: string
}) {
  const router = useRouter()
  const { showToast } = useToast()
  const [data, setData] = useState<AdminEnterpriseDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [suspending, setSuspending] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAdminEnterpriseDetail(enterpriseId)
      setData(res)
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to load enterprise", "error", 5000)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [enterpriseId, showToast])

  useEffect(() => {
    void load()
  }, [load])

  const onApprove = async () => {
    if (!data || data.enterprise.account.Status === "Active") return
    setApproving(true)
    try {
      await unlockAdminEnterpriseAccount(data.enterprise.account.AccountID)
      showToast("Enterprise activated", "success", 3000)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Approve failed", "error", 5000)
    } finally {
      setApproving(false)
    }
  }

  const onSuspend = async () => {
    if (!data || data.enterprise.account.Status !== "Active") return
    setSuspending(true)
    try {
      await lockAdminEnterpriseAccount(data.enterprise.account.AccountID)
      showToast("Enterprise suspended", "success", 3000)
      await load()
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Suspend failed", "error", 5000)
    } finally {
      setSuspending(false)
    }
  }

  const dash = (v: string | null | undefined) =>
    v == null || String(v).trim() === "" ? "—" : v

  if (loading) {
    return (
      <div className="text-center text-[13px] leading-4 text-slate-500 py-16">Loading…</div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/enterprises/list"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="text-sm text-slate-600">Enterprise not found or you do not have access.</p>
      </div>
    )
  }

  const { enterprise, business, stats, linkedProducts, primaryCategoryName } = data
  const isActive = enterprise.account.Status === "Active"
  const hasPendingInvitation = Boolean(data.hasPendingInvitation)
  const uiPending = !isActive && hasPendingInvitation
  const statusLabel = isActive ? "Active" : uiPending ? "Pending" : "Suspended"
  const satisfaction =
    stats.satisfactionRatingAvg != null && stats.reviewCount > 0
      ? Number(stats.satisfactionRatingAvg).toFixed(1)
      : "N/A"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/admin/enterprises/list"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-[18px] leading-6 font-bold text-slate-900">Enterprise Details</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] leading-4 text-slate-600">
              <span className="font-mono text-slate-800">{enterprise.EnterpriseID}</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-800">{enterprise.EnterpriseName}</span>
              {isActive ? (
                <span className="ml-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {statusLabel}
                </span>
              ) : uiPending ? (
                <span className="ml-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {statusLabel}
                </span>
              ) : (
                <span className="ml-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {statusLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/enterprises/list")}
            className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-[12px] font-medium text-black hover:bg-slate-50"
          >
            Cancel
          </button>
          {isActive ? (
            <button
              type="button"
              onClick={() => showToast("Delete enterprise is not available yet.", "error", 4000)}
              className="h-9 rounded-lg border border-red-500 bg-rose-50/80 px-4 text-[12px] font-medium text-red-600 hover:bg-rose-100/80"
            >
              Delete enterprise
            </button>
          ) : (
            <button
              type="button"
              onClick={() => showToast("Delete enterprise is not available yet.", "error", 4000)}
              className="h-9 rounded-lg border border-red-500 bg-slate-50 px-4 text-[12px] font-medium text-red-600 hover:bg-slate-100"
            >
              Delete enterprise
            </button>
          )}
          {isActive ? (
            <button
              type="button"
              disabled={suspending}
              onClick={() => void onSuspend()}
              className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-[12px] font-medium text-black hover:bg-slate-50 disabled:opacity-50"
            >
              {suspending ? "Suspending…" : "Suspend enterprise"}
            </button>
          ) : uiPending ? (
            <button
              type="button"
              disabled={approving}
              onClick={() => void onApprove()}
              className="h-9 rounded-lg border border-green-600 bg-slate-50 px-4 text-[12px] font-medium text-green-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {approving ? "Approving…" : "Approve enterprise"}
            </button>
          ) : (
            <button
              type="button"
              disabled={approving}
              onClick={() => void onApprove()}
              className="h-9 rounded-lg border border-blue-600 bg-slate-50 px-4 text-[12px] font-medium text-blue-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {approving ? "Activating…" : "Activate enterprise"}
            </button>
          )}
          <button
            type="button"
            onClick={() => showToast("Edit enterprise form is not available yet.", "error", 4000)}
            className="h-9 rounded-lg bg-blue-600 px-4 text-[12px] font-medium text-white hover:bg-blue-700"
          >
            Edit enterprise
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title="Enterprise information" icon={FileText}>
          <Field label="Enterprise name" value={enterprise.EnterpriseName} />
          <Field label="Enterprise ID" value={enterprise.EnterpriseID} />
          <Field label="Category" value={dash(primaryCategoryName)} />
          <Field
            label="Status"
            value={
              isActive ? (
                <span className="inline-flex rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Active
                </span>
              ) : uiPending ? (
                <span className="inline-flex rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Pending
                </span>
              ) : (
                <span className="inline-flex rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                  Suspended
                </span>
              )
            }
          />
          <Field
            label="Joined date"
            value={formatDate(String(enterprise.account.CreatedAt))}
          />
          <Field label="Email address" value={enterprise.account.Email} />
          <Field label="Username" value={enterprise.account.Username} />
          <Field label="Phone number" value={dash(enterprise.PhoneNumber)} />
          <Field label="Registered address" value={dash(enterprise.Address)} />
        </InfoCard>

        <InfoCard title="Business information" icon={Building2}>
          <Field label="Legal business name" value={dash(business.legalBusinessName)} />
          <Field label="Registration number" value={dash(business.registrationNumber)} />
          <Field label="Tax ID / VAT" value={dash(business.taxId)} />
          <Field label="Bank account" value={business.bankAccountMasked} />
          <Field label="Payout method" value={business.payoutMethod} />
        </InfoCard>
      </div>

      <div>
        <h2 className="mb-4 text-[15px] leading-5 font-semibold text-slate-900">
          Performance summary
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total products"
            value={String(stats.totalProducts)}
            icon={Package}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            label="Total revenue"
            value={formatPriceCompact(num(stats.totalRevenue))}
            icon={DollarSign}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            label="Total orders"
            value={String(stats.totalOrders)}
            icon={ShoppingBag}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
          />
          <StatCard
            label="Total returns"
            value={String(stats.totalReturns)}
            icon={RotateCcw}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
          <StatCard
            label="Cancellation rate"
            value={`${stats.cancellationRatePercent}%`}
            icon={Percent}
            iconBg="bg-rose-50"
            iconColor="text-rose-600"
          />
          <StatCard
            label="Satisfaction rating"
            value={satisfaction}
            icon={Star}
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[15px] leading-5 font-semibold text-slate-900">Linked products</h2>
        {linkedProducts.length === 0 ? (
          <p className="text-[13px] text-slate-500">No products linked to this enterprise yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-4 text-xs font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Product
                  </th>
                  <th className="py-2 pr-4 text-xs font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Category
                  </th>
                  <th className="py-2 pr-4 text-xs font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Price
                  </th>
                  <th className="py-2 pr-0 text-xs font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Available
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {linkedProducts.map((p) => (
                  <tr key={p.FoodID}>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                          {p.ImageURL ? (
                            <Image
                              src={p.ImageURL}
                              alt=""
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                              —
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-slate-900">{p.DishName}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{dash(p.CategoryName)}</td>
                    <td className="py-2 pr-4 font-medium text-slate-800">
                      {formatPriceCompact(num(p.Price))}
                    </td>
                    <td className="py-2 pr-0">
                      {p.IsAvailable ? (
                        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                          Yes
                        </span>
                      ) : (
                        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
