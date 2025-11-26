"use client"

import React from 'react'
import { type Voucher } from '@/app/enterprise/discount/VoucherList'
import { approveVoucherAction } from './actions'
import { Check } from 'lucide-react'

export function AdminVoucherRow({ voucher }: { voucher: Voucher }) {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN')
  const statusBadge = (status: string) => {
    const cls: Record<string, string> = {
      Active: 'bg-green-100 text-green-800',
      Inactive: 'bg-red-100 text-red-800',
      Expired: 'bg-gray-100 text-gray-800',
      Pending: 'bg-yellow-100 text-yellow-800'
    }
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${cls[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>
  }
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
      <div className="col-span-3 font-medium text-gray-900">{voucher.Code}</div>
      <div className="col-span-2 text-gray-700">
        <div className="font-medium">
          {voucher.DiscountPercent ? <span>{voucher.DiscountPercent}%</span> : <span>{voucher.DiscountAmount}</span>}
        </div>
        {voucher.MaxUsage && (
          <div className="text-xs text-gray-500">{voucher.UsedCount}/{voucher.MaxUsage} used</div>
        )}
      </div>
      <div className="col-span-3 text-gray-500">{formatDate(voucher.ExpiryDate)}</div>
      <div className="col-span-3">{statusBadge(voucher.Status)}</div>
      <div className="col-span-1 flex justify-end">
        {voucher.Status === 'Pending' && (
          <form action={approveVoucherAction}>
            <input type="hidden" name="id" value={voucher.VoucherID} />
            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-sm">
              <Check className="w-4 h-4" /> Approve
            </button>
          </form>
        )}
      </div>
    </div>
  )
}


