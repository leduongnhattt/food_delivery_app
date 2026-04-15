"use client"

import React from 'react'
import { Check } from 'lucide-react'
import type { AdminVoucherListItem } from '@/types/admin-api.types'
import { approveAdminVoucher } from '@/services/admin.service'
import { useToast } from '@/contexts/toast-context'

export function AdminVoucherRow({
  voucher,
  onApproved,
}: {
  voucher: AdminVoucherListItem
  onApproved?: () => void
}) {
  const { showToast } = useToast()
  const formatDate = (dateString: string | null) =>
    dateString ? new Date(dateString).toLocaleDateString('vi-VN') : 'N/A'
  const statusBadge = (status: string) => {
    const cls: Record<string, string> = {
      Active: 'bg-green-100 text-green-800',
      Inactive: 'bg-red-100 text-red-800',
      Expired: 'bg-gray-100 text-gray-800',
      Pending: 'bg-yellow-100 text-yellow-800'
    }
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>
  }

  async function handleApprove() {
    try {
      await approveAdminVoucher(voucher.id)
      showToast('Voucher approved', 'success', 2500)
      onApproved?.()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to approve voucher'
      showToast(message, 'error', 4000)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
      <div className="col-span-3 font-medium text-gray-900">{voucher.code}</div>
      <div className="col-span-2 text-gray-700">
        <div className="font-medium">
          {voucher.discountPercent != null ? (
            <span>{voucher.discountPercent}%</span>
          ) : (
            <span>{voucher.discountAmount ?? 'N/A'}</span>
          )}
        </div>
        {voucher.maxUsage != null && voucher.maxUsage > 0 && (
          <div className="text-xs text-gray-500">{voucher.usedCount}/{voucher.maxUsage} used</div>
        )}
      </div>
      <div className="col-span-3 text-gray-500">{formatDate(voucher.expiryDate)}</div>
      <div className="col-span-3">{statusBadge(voucher.status)}</div>
      <div className="col-span-1 flex justify-end">
        {voucher.status === 'Pending' && (
          <button
            type="button"
            onClick={handleApprove}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm"
          >
            <Check className="w-4 h-4" /> Approve
          </button>
        )}
      </div>
    </div>
  )
}


