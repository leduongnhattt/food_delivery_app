"use client"

import { useParams } from "next/navigation"
import VoucherEditAdminPage from "@/components/admin/vouchers/edit/VoucherEditAdminPage"

export default function AdminVoucherEditRoutePage() {
  const params = useParams()
  const voucherId = typeof params?.voucherId === "string" ? params.voucherId : ""
  if (!voucherId) {
    return (
      <div className="py-16 text-center text-[13px] leading-4 text-slate-500">
        Invalid voucher.
      </div>
    )
  }
  return <VoucherEditAdminPage voucherId={voucherId} />
}

