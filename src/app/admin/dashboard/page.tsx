"use client";

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Building2, Users, Tag, Wallet, Activity } from 'lucide-react'
import RangeSelect from '@/components/admin/shared/range-select'
import { fetchAdminDashboardSummary } from '@/services/admin.service'
import type { AdminDashboardSummaryResponse } from '@/types/admin-api.types'
import { formatCurrency } from '@/lib/order-utils'
import { formatDate } from '@/lib/utils'

export default function AdminDashboardPage() {
  const searchParams = useSearchParams()
  const rangeParam = searchParams.get('range') || '30d'

  const rangeLabelMap: Record<string, string> = {
    '30d': 'Last 30 days',
    '90d': 'Last 90 days',
    '1y': 'Last 1 year',
  }

  const [data, setData] = useState<AdminDashboardSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const queryKey = useMemo(() => rangeParam, [rangeParam])

  async function load() {
    setLoading(true)
    try {
      const res = await fetchAdminDashboardSummary({ range: rangeParam })
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  const revenueInRange = data?.revenueInRange ?? 0
  const ordersCount = data?.ordersCount ?? 0
  const averageOrderValue = revenueInRange / Math.max(1, ordersCount)
  const pendingVouchersTop = data?.pendingVouchersTop ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-cyan-300 bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-600 p-5 md:p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-cyan-100 mt-1">System overview and approvals</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="range" className="text-sm text-cyan-100">Range</label>
          <RangeSelect current={rangeParam} />
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/95 bg-white/15 hover:bg-white/20 border border-white/20"
            disabled={loading}
          >
            <Activity className="h-4 w-4" />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: KPIs */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-indigo-200 bg-white p-5 transition-all hover:shadow-md hover:border-indigo-300">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-indigo-700">Active Enterprises</span>
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{data?.activeEnterpriseCount ?? (loading ? '…' : 0)}</div>
              <div className="text-xs text-slate-500 mt-1">All time</div>
            </div>

            <div className="rounded-2xl border border-violet-200 bg-white p-5 transition-all hover:shadow-md hover:border-violet-300">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-violet-700">Total Customers</span>
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{data?.customerCount ?? (loading ? '…' : 0)}</div>
              <div className="text-xs text-slate-500 mt-1">Registered</div>
            </div>

            <div className="rounded-2xl border border-fuchsia-200 bg-white p-5 transition-all hover:shadow-md hover:border-fuchsia-300">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-fuchsia-700">Total Categories</span>
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 text-fuchsia-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{data?.categoriesCount ?? (loading ? '…' : 0)}</div>
              <div className="text-xs text-slate-500 mt-1">Catalog size</div>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-white p-5 transition-all hover:shadow-md hover:border-cyan-300">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-cyan-700">Pending Vouchers</span>
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-3xl font-extrabold text-slate-900">{data?.pendingVouchersCount ?? (loading ? '…' : 0)}</div>
              <div className="text-xs text-slate-500 mt-1">Awaiting approval</div>
            </div>
          </div>

          {/* Pending vouchers */}
          <div className="rounded-2xl border border-indigo-200 bg-white/80 backdrop-blur-sm shadow-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-indigo-900">Pending voucher approvals</h3>
                <p className="text-xs text-indigo-700 mt-0.5">Latest 3 submissions waiting for review</p>
              </div>
              <a href="/admin/discount" className="text-indigo-700 hover:underline text-sm">View all</a>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-slate-500 text-sm text-center">
                Loading vouchers...
              </div>
            ) : pendingVouchersTop.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-slate-500 text-sm text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2">🔎</div>
                No vouchers awaiting approval. They will appear here once submitted.
              </div>
            ) : (
              <ul className="space-y-3">
                {pendingVouchersTop.map((v) => {
                  const discountLabel = v.discountPercent != null
                    ? `${v.discountPercent}%`
                    : v.discountAmount != null
                      ? `${formatCurrency(v.discountAmount)}`
                      : '—'
                  const usage = typeof v.maxUsage === 'number' && v.maxUsage > 0
                    ? Math.min(100, Math.round((v.usedCount / v.maxUsage) * 100))
                    : undefined
                  const expired = v.expiryDate ? new Date(v.expiryDate) < new Date() : false
                  return (
                    <li key={v.id} className="bg-white border border-indigo-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                      <div className="flex items-stretch">
                        <div className="w-1 bg-gradient-to-b from-indigo-400 to-fuchsia-500" />
                        <div className="flex-1 p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span className="font-semibold text-slate-900 truncate">{v.code}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{discountLabel}</span>
                                {v.expiryDate && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${expired ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                    {expired ? 'Expired' : `Expires ${formatDate(String(v.expiryDate)).split(',')[0]}`}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 truncate">
                                {v.enterpriseName ? `${v.enterpriseName} • ` : ''}
                                Created {formatDate(String(v.createdAt)).split(',')[0]}
                              </div>
                            </div>
                            <a href={`/admin/discount?q=${encodeURIComponent(v.code)}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm shrink-0">Review</a>
                          </div>
                          {typeof usage === 'number' && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                <span>Usage</span>
                                <span>{v.usedCount}/{v.maxUsage}</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500" style={{ width: `${usage}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Right column: Revenue and Orders */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Revenue ({rangeLabelMap[rangeParam] || rangeLabelMap['30d']})</div>
                <div className="mt-1 text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>{formatCurrency(revenueInRange)}</span>
                  <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">Stripe</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500">Orders ({rangeLabelMap[rangeParam] || rangeLabelMap['30d']})</div>
                <div className="mt-1 text-3xl font-extrabold text-slate-900">{ordersCount}</div>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-600">
              Average order value:{' '}
              <span className="font-semibold text-slate-900">{formatCurrency(averageOrderValue)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

