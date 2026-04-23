"use client";

import type { AdminOrderDetail } from "@/types/admin-api.types";
import { formatPrice } from "@/lib/utils";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-1 text-[12px] font-semibold text-slate-700">
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-[12px] text-slate-500">{label}</div>
      <div
        className={`text-[12px] text-right ${
          muted ? "text-slate-400" : strong ? "font-semibold text-slate-800" : "text-slate-700"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function AdminOrderPaymentFeesCard({ order }: { order: AdminOrderDetail }) {
  // UI-only: split fees are not in AdminOrderDetail yet.
  const grandTotal = formatPrice(order.TotalAmount);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-semibold text-slate-700">
        Payment & Fees
      </div>

      <div className="px-4 py-3 space-y-4">
        <div className="space-y-2.5">
          <SectionTitle>Buyer Payment</SectionTitle>
          <Row label="Item Price:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Buyer Paid Shipping Fee:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Platform Voucher Discount:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Shop Voucher Discount:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Coin Offset/Cash Offset:" value={<span className="text-slate-400">—</span>} muted />
          <div className="h-px bg-slate-100" />
          <Row label="Grand Total:" value={grandTotal} strong />
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-2.5">
          <SectionTitle>Shipping Fee</SectionTitle>
          <Row label="Order EFC covered by seller:" value={<span className="text-slate-400">No</span>} muted />
          <Row label="Estimated Shipping Fee:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Actual Shipping Fee used in Escrow:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Platform Provided Shipping Rebate & Rule ID:" value={<span className="text-slate-400">—</span>} muted />
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-2.5">
          <SectionTitle>Seller Fees</SectionTitle>
          <Row label="Service Fee:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Commission Fee:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Seller Transaction Fee:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="AMS Commission Fee:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Escrow Amount:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Seller Compensation Amount:" value={<span className="text-slate-400">—</span>} muted />
        </div>
      </div>
    </div>
  );
}

