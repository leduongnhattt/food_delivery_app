"use client"

import { useParams } from "next/navigation"
import VoucherDetailAdminPage from "@/components/admin/vouchers/detail/VoucherDetailAdminPage"

export default function AdminDiscountDetailRoutePage() {
  const params = useParams()
  const voucherId = typeof params?.voucherId === "string" ? params.voucherId : ""
  if (!voucherId) {
    return (
      <div className="py-16 text-center text-[13px] leading-4 text-slate-500">
        Invalid voucher.
      </div>
    )
  }
  return <VoucherDetailAdminPage voucherId={voucherId} />
}

