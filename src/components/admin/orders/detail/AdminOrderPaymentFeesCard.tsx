"use client";

import { useMemo } from "react";
import type { AdminOrderDetail } from "@/types/admin-api.types";
import {
  adminVoucherIsPlatform,
  adminVoucherIsShop,
  adminVoucherRuleLabel,
} from "@/lib/admin-order-promotion";
import {
  isSelfDeliveryMetadata,
  parseOrderDeliveryMethod,
  parseOrderMetadataCheckout,
  resolveBuyerPaidShippingFee,
} from "@/lib/order-metadata-checkout";
import { formatPrice } from "@/lib/utils";

function n(v: number | string): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

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
  const grandTotal = formatPrice(order.TotalAmount);

  const itemsSubtotal = useMemo(
    () => order.orderDetails.reduce((acc, d) => acc + n(d.SubTotal), 0),
    [order.orderDetails],
  );

  const checkout = useMemo(
    () => parseOrderMetadataCheckout(order.Metadata ?? null),
    [order.Metadata],
  );

  const itemPriceDisplay = useMemo(() => {
    const fromMeta = checkout?.subtotal;
    if (fromMeta != null && fromMeta >= 0) return formatPrice(fromMeta);
    return formatPrice(itemsSubtotal);
  }, [checkout?.subtotal, itemsSubtotal]);

  const shipFeeAmount = useMemo(() => resolveBuyerPaidShippingFee(order), [order]);

  const shippingDisplay = useMemo(() => {
    if (shipFeeAmount == null) return null;
    return formatPrice(shipFeeAmount);
  }, [shipFeeAmount]);

  const efcSellerLabel = useMemo(() => {
    if (!isSelfDeliveryMetadata(order.Metadata ?? null)) return "—";
    const dm = parseOrderDeliveryMethod(order.Metadata ?? null);
    return dm ? `N/A (self delivery · ${dm})` : "N/A (self delivery)";
  }, [order.Metadata]);

  const v = order.voucher;
  const shopV = adminVoucherIsShop(v);
  const platformV = adminVoucherIsPlatform(v);
  const ruleLabel = adminVoucherRuleLabel(v ?? undefined);

  const commissionTotal = useMemo(() => {
    const head = order.CommissionAmount;
    if (head !== undefined && head !== null && `${head}`.trim() !== "") {
      const v = n(head as number | string);
      if (Number.isFinite(v)) return v;
    }
    let sum = 0;
    let any = false;
    for (const d of order.orderDetails) {
      const c = d.CommissionLineAmount;
      if (c !== undefined && c !== null && `${c}`.trim() !== "") {
        any = true;
        sum += n(c as number | string);
      }
    }
    return any ? sum : null;
  }, [order.CommissionAmount, order.orderDetails]);

  const commissionFeeDisplay =
    commissionTotal != null && Number.isFinite(commissionTotal) ? formatPrice(commissionTotal) : null;

  const sellerMerchAfterCommission = useMemo(() => {
    if (commissionTotal == null || !Number.isFinite(commissionTotal)) return null;
    return Math.max(0, Math.round((itemsSubtotal - commissionTotal) * 100) / 100);
  }, [commissionTotal, itemsSubtotal]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-semibold text-slate-700">
        Payment & Fees
      </div>

      <div className="px-4 py-3 space-y-4">
        <div className="space-y-2.5">
          <SectionTitle>Buyer Payment</SectionTitle>
          <Row label="Item Price:" value={itemPriceDisplay} />
          <Row
            label="Buyer Paid Shipping Fee:"
            value={
              shippingDisplay != null ? (
                shippingDisplay
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
            muted={shippingDisplay == null}
          />
          <Row
            label="Platform Voucher Discount:"
            value={<span className="truncate">{platformV ? ruleLabel : "—"}</span>}
            muted={!platformV}
          />
          <Row
            label="Shop Voucher Discount:"
            value={<span className="truncate">{shopV ? ruleLabel : "—"}</span>}
            muted={!shopV}
          />
          <Row label="Coin Offset/Cash Offset:" value={<span className="text-slate-400">—</span>} muted />
          <div className="h-px bg-slate-100" />
          <Row label="Grand Total:" value={grandTotal} strong />
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-2.5">
          <SectionTitle>Shipping Fee</SectionTitle>
          <Row
            label="Order EFC covered by seller:"
            value={<span className="text-slate-700">{efcSellerLabel}</span>}
            muted={efcSellerLabel === "—"}
          />
          <Row
            label="Estimated Shipping Fee:"
            value={
              shippingDisplay != null ? (
                shippingDisplay
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
            muted={shippingDisplay == null}
          />
          <Row
            label="Actual Shipping Fee used in Escrow:"
            value={
              shippingDisplay != null ? (
                shippingDisplay
              ) : (
                <span className="text-slate-400">N/A (no escrow)</span>
              )
            }
            muted={shippingDisplay == null}
          />
          <Row label="Platform Provided Shipping Rebate & Rule ID:" value={<span className="text-slate-400">—</span>} muted />
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-2.5">
          <SectionTitle>Seller Fees</SectionTitle>
          <Row label="Service Fee:" value={<span className="text-slate-400">—</span>} muted />
          <Row
            label="Commission Fee:"
            value={
              commissionFeeDisplay != null ? (
                commissionFeeDisplay
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
            muted={commissionFeeDisplay == null}
          />
          <Row label="Seller Transaction Fee:" value={<span className="text-slate-400">—</span>} muted />
          <Row label="AMS Commission Fee:" value={<span className="text-slate-400">—</span>} muted />
          <Row
            label="Escrow Amount:"
            value={<span className="text-slate-500">N/A (not used)</span>}
            muted
          />
          <Row
            label="Seller Compensation Amount:"
            value={
              sellerMerchAfterCommission != null ? (
                <span title="Merchandise subtotal minus platform commission (excludes delivery & settlement)">
                  {formatPrice(sellerMerchAfterCommission)}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
            muted={sellerMerchAfterCommission == null}
          />
        </div>
      </div>
    </div>
  );
}

