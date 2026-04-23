"use client";

import type { AdminOrderDetail } from "@/types/admin-api.types";

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
  muted,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className={`text-[12px] text-right ${muted ? "text-slate-400" : "text-slate-700"}`}>
        {value}
      </div>
    </div>
  );
}

function Masked() {
  return <span className="text-slate-400">••••••••••••••</span>;
}

export function AdminOrderLogisticsInfoCard({ order }: { order: AdminOrderDetail }) {
  const buyer = order.customer?.FullName || "—";

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-semibold text-slate-700">
        Logistics Info
      </div>

      <div className="px-4 py-3 space-y-4">
        <div className="space-y-2.5">
          <SectionTitle>General Info</SectionTitle>
          <Row label="Courier Name:" value={<span className="text-slate-400">LBC Express</span>} muted />
          <Row label="Fulfillment Channel:" value={<span className="text-slate-400">Self Ship</span>} muted />
          <Row label="Shipping Carrier:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Shipping Tracking No.:" value={<span className="text-slate-400">—</span>} muted />
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-2.5">
          <SectionTitle>Delivery Info</SectionTitle>
          <Row label="Ship To Name/Phone:" value={<Masked />} />
          <Row label="Ship To Address:" value={<Masked />} />
          <Row label="Preferred Delivery Time:" value={<span className="text-slate-400">Anytime</span>} muted />
          <Row label="Drop-shipper Name/Phone:" value={<span className="text-slate-400">N/A</span>} muted />
          <Row label="Sender Real Name:" value={<span className="text-slate-400">{buyer}</span>} muted />
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-2.5">
          <SectionTitle>Pickup Info</SectionTitle>
          <Row label="Pickup Name and Phone:" value={<Masked />} />
          <Row label="Pickup Address:" value={<Masked />} />
          <Row label="Original Pickup Address:" value={<Masked />} />
          <Row label="Seller Days to Ship:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Arrange Pickup Time:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Actual Pickup Time:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="Pickup Remark:" value={<span className="text-slate-400">—</span>} muted />
        </div>
      </div>
    </div>
  );
}

