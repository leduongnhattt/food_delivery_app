"use client";

import AdminCreateVoucherForm from './AdminCreateVoucherForm'
import VoucherSearch from '@/components/admin/vouchers/VoucherSearch'
import TabsVouchers from '@/components/admin/vouchers/TabsVouchers'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import type { AdminVoucherListItem } from '@/types/admin-api.types'
import { listAdminVouchers } from '@/services/admin.service'
import { useToast } from '@/contexts/toast-context'

export default function AdminDiscountPage() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const status = (searchParams.get('status') || 'all') as
    | 'pending'
    | 'approved'
    | 'all'
  const q = (searchParams.get('q') || '').trim()

  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<AdminVoucherListItem[]>([])

  const queryKey = useMemo(() => `${status}::${q}`, [status, q])

  async function load() {
    setLoading(true)
    try {
      const res = await listAdminVouchers({ status, q, limit: 50 })
      setVouchers(res.items || [])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load vouchers'
      showToast(message, 'error', 4000)
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
            Discounts
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            Approve pending vouchers from enterprises
          </p>
        </div>
        <VoucherSearch currentStatus={status} currentSearch={q} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <AdminCreateVoucherForm onCreated={load} />
        </div>
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-4">
          <TabsVouchers current={status} search={q} />

          {/* Search Results Info */}
          {(q || status !== 'all') && (
            <div className="mt-4 mb-2 text-[13px] leading-4 font-normal text-slate-600">
              {q ? (
                <span>Found {vouchers.length} voucher{vouchers.length !== 1 ? 's' : ''} matching "{q}"</span>
              ) : (
                <span>Showing {vouchers.length} {status} voucher{vouchers.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">Voucher Code</th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">Discount Percent</th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">Discount Amount</th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">Usage Count</th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">Expiry Date</th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 text-[13px] leading-4 font-normal py-8">
                      Loading...
                    </td>
                  </tr>
                ) : vouchers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 text-[13px] leading-4 font-normal py-8">
                      No vouchers found
                    </td>
                  </tr>
                ) : (
                  vouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 text-[13px] leading-4 font-medium text-slate-900">
                        {v.code}
                      </td>
                      <td className="py-3 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                        {v.discountPercent != null ? `${v.discountPercent}%` : 'N/A'}
                      </td>
                      <td className="py-3 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                        {v.discountAmount != null ? `$${v.discountAmount}` : 'N/A'}
                      </td>
                      <td className="py-3 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {v.usedCount || 0} / {v.maxUsage ?? '∞'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[13px] leading-4 font-normal text-slate-700">
                        {v.expiryDate ? new Date(v.expiryDate).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="py-3 pr-4">
                        {v.status === 'Approved' ? (
                          <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Approved
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>
      </div>
    </div>
  )
}

 