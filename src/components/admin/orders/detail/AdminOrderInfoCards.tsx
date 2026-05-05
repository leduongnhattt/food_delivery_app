"use client";

import { useMemo } from "react";
import type { AdminOrderDetail } from "@/types/admin-api.types";
import {
  adminPaymentChannelLabel,
  adminPaymentTypeLabel,
  primaryPaymentRow,
} from "@/lib/admin-order-payment";
import {
  adminVoucherIsPlatform,
  adminVoucherIsShop,
  adminVoucherRuleLabel,
} from "@/lib/admin-order-promotion";
import { formatDate } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-[12px] text-slate-500">{label}</div>
      <div className="min-w-0 text-right text-[12px] font-medium text-slate-700">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-semibold text-slate-700">
        {title}
      </div>
      <div className="px-4 py-3 space-y-2.5">{children}</div>
    </div>
  );
}

export function AdminOrderInfoCards({ order }: { order: AdminOrderDetail }) {
  const sellerNames = Array.from(
    new Set(order.orderDetails.map((d) => d.food.enterprise.EnterpriseName).filter(Boolean)),
  );

  const primaryPay = useMemo(() => primaryPaymentRow(order.payments), [order.payments]);
  const paymentType = adminPaymentTypeLabel(primaryPay?.PaymentMethod);
  const paymentChannel = primaryPay ? adminPaymentChannelLabel(primaryPay.PaymentMethod) : "—";

  const v = order.voucher;
  const shopV = adminVoucherIsShop(v);
  const platformV = adminVoucherIsPlatform(v);
  const ruleLabel = adminVoucherRuleLabel(v ?? undefined);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <Card title="Checkout Information">
        <InfoRow value={<span className="font-mono text-[11px] text-slate-600">{order.OrderID}</span>} label="Order ID" />
        <InfoRow value={formatDate(order.OrderDate)} label="Purchased On" />
        <InfoRow value={<span className="truncate">{order.customer.FullName}</span>} label="Buyer" />
        <InfoRow value={<span className="truncate">{sellerNames.join(", ") || "—"}</span>} label="Seller" />
        <InfoRow value={formatPrice(order.TotalAmount)} label="Grand Total" />
        <InfoRow value={<span className="truncate">{paymentType}</span>} label="Payment Type" />
        <InfoRow
          value={<span className="truncate">{paymentChannel}</span>}
          label="Payment Channel Name"
        />
      </Card>

      <Card title="Promotion Info">
        <InfoRow
          value={<span className="text-slate-400">—</span>}
          label="Seller Discount"
        />
        <InfoRow
          value={
            <span className="font-mono text-[11px] text-slate-600 truncate">
              {shopV && v ? `${v.Code} · ${v.VoucherID}` : "—"}
            </span>
          }
          label="Seller Promotion IDs"
        />
        <InfoRow
          value={
            <span className="font-mono text-[11px] text-slate-600 truncate">
              {platformV && v ? `${v.Code} · ${v.VoucherID}` : "—"}
            </span>
          }
          label="Exclusive Price Promotion IDs"
        />
        <InfoRow
          value={<span className="truncate">{platformV ? ruleLabel : "—"}</span>}
          label="Platform Voucher Discount"
        />
        <InfoRow
          value={<span className="truncate">{shopV ? ruleLabel : "—"}</span>}
          label="Shop Voucher Discount"
        />
        <InfoRow value={<span className="text-slate-400">—</span>} label="Coin Spent/Cash Offset" />
        <InfoRow value={<span className="text-slate-400">—</span>} label="Coins Earned Total" />
      </Card>
    </div>
  );
}

