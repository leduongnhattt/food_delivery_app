"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { AdminOrderDetail } from "@/types/admin-api.types";
import { isSelfDeliveryMetadata } from "@/lib/order-metadata-checkout";
import {
  pickupArrangeAtIso,
  pickupHandoffAtIso,
  sellerLeadTimeLabel,
} from "@/lib/order-metadata-pickup";
import { formatDate } from "@/lib/utils";

const MASK = "••••••••••••••";

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
      <div className={`min-w-0 text-[12px] text-right ${muted ? "text-slate-400" : "text-slate-700"}`}>
        {value}
      </div>
    </div>
  );
}

/**
 * Masked PII with an eye toggle to reveal (client-side only; data already returned from admin API).
 */
function RevealableSensitiveValue({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  const trimmed = value.trim();
  const empty = !trimmed;

  if (empty) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="flex items-start justify-end gap-1.5">
      <span className="max-w-[min(100%,18rem)] whitespace-pre-wrap break-words text-right">
        {revealed ? trimmed : MASK}
      </span>
      <button
        type="button"
        onClick={() => setRevealed((v) => !v)}
        className="mt-0.5 shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label={revealed ? "Hide value" : "Reveal value"}
        aria-pressed={revealed}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function dedupeEnterprises(order: AdminOrderDetail) {
  const map = new Map<
    string,
    { EnterpriseName: string; PhoneNumber: string; Address: string }
  >();
  for (const d of order.orderDetails) {
    const e = d.food.enterprise;
    if (!map.has(e.EnterpriseID)) {
      map.set(e.EnterpriseID, {
        EnterpriseName: e.EnterpriseName,
        PhoneNumber: e.PhoneNumber ?? "",
        Address: e.Address ?? "",
      });
    }
  }
  return [...map.values()];
}

export function AdminOrderLogisticsInfoCard({ order }: { order: AdminOrderDetail }) {
  const pickups = useMemo(() => dedupeEnterprises(order), [order]);

  const shipToNamePhone = useMemo(() => {
    const name = order.customer?.FullName?.trim() || "";
    const phone = order.customer?.PhoneNumber?.trim() || "";
    if (!name && !phone) return "";
    if (!name) return phone;
    if (!phone) return name;
    return `${name} / ${phone}`;
  }, [order.customer]);

  const deliveryAddress = (order.DeliveryAddress ?? "").trim();

  const pickupNamesPhones = useMemo(
    () =>
      pickups
        .map((p) => {
          const n = p.EnterpriseName?.trim() || "";
          const ph = p.PhoneNumber?.trim() || "";
          if (!n && !ph) return "";
          if (!n) return ph;
          if (!ph) return n;
          return `${n} — ${ph}`;
        })
        .filter(Boolean)
        .join("\n"),
    [pickups],
  );

  const pickupAddresses = useMemo(
    () =>
      pickups
        .map((p) => (p.Address ?? "").trim())
        .filter(Boolean)
        .join("\n"),
    [pickups],
  );

  const senderSellerLabel = useMemo(() => {
    if (!pickups.length) return "—";
    return pickups.map((p) => p.EnterpriseName).join(", ");
  }, [pickups]);

  /** Self-ship: courier / carrier = restaurant(s) on the order */
  const selfShipShopLabel = useMemo(() => {
    if (!pickups.length) return "—";
    return pickups.map((p) => p.EnterpriseName.trim()).filter(Boolean).join(", ");
  }, [pickups]);

  const preferredDeliveryLabel = useMemo(() => {
    const raw = order.EstimatedDeliveryTime;
    if (!raw) return "—";
    const formatted = formatDate(raw);
    return formatted === "Invalid Date" ? raw : formatted;
  }, [order.EstimatedDeliveryTime]);

  const deliveryNote = (order.DeliveryNote ?? "").trim();

  const arrangeIso = useMemo(() => pickupArrangeAtIso(order.Metadata ?? null), [order.Metadata]);
  const handoffIso = useMemo(() => pickupHandoffAtIso(order.Metadata), [order.Metadata]);
  const actualPickupIso = useMemo(() => {
    const d = order.DeliveredAt;
    const dStr = typeof d === "string" ? d.trim() : d != null ? String(d) : "";
    return handoffIso ?? (dStr ? dStr : null);
  }, [handoffIso, order.DeliveredAt]);

  const arrangeLabel = useMemo(() => {
    if (!arrangeIso) return null;
    const f = formatDate(arrangeIso);
    return f === "Invalid Date" ? arrangeIso : f;
  }, [arrangeIso]);

  const actualLabel = useMemo(() => {
    if (!actualPickupIso) return null;
    const f = formatDate(actualPickupIso);
    return f === "Invalid Date" ? actualPickupIso : f;
  }, [actualPickupIso]);

  const sellerDaysLabel = useMemo(
    () => sellerLeadTimeLabel(order.OrderDate, order.Metadata ?? null, order.DeliveredAt ?? null),
    [order.OrderDate, order.Metadata, order.DeliveredAt],
  );

  const pickupRemarkFromNote =
    isSelfDeliveryMetadata(order.Metadata ?? null) && deliveryNote ? deliveryNote : "";

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-semibold text-slate-700">
        Logistics Info
      </div>

      <div className="px-4 py-3 space-y-4">
        <div className="space-y-2.5">
          <SectionTitle>General Info</SectionTitle>
          <Row
            label="Courier Name:"
            value={<span className="text-slate-700">{selfShipShopLabel}</span>}
          />
          <Row
            label="Fulfillment Channel:"
            value={<span className="text-slate-700">Self ship (restaurant)</span>}
          />
          <Row
            label="Shipping Carrier:"
            value={<span className="text-slate-700">{selfShipShopLabel}</span>}
          />
          <Row
            label="Shipping Tracking No.:"
            value={
              <span className="text-slate-500" title="Third-party courier tracking is not used for self ship">
                N/A (self ship)
              </span>
            }
          />
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-2.5">
          <SectionTitle>Delivery Info</SectionTitle>
          <Row label="Ship To Name/Phone:" value={<RevealableSensitiveValue value={shipToNamePhone} />} />
          <Row label="Ship To Address:" value={<RevealableSensitiveValue value={deliveryAddress} />} />
          <Row label="Preferred Delivery Time:" value={preferredDeliveryLabel} />
          <Row label="Drop-shipper Name/Phone:" value={<span className="text-slate-400">—</span>} muted />
          <Row
            label="Seller / restaurant (pickup):"
            value={<span className="text-slate-700">{senderSellerLabel}</span>}
          />
          <Row
            label="Delivery Note:"
            value={
              deliveryNote ? (
                <RevealableSensitiveValue value={deliveryNote} />
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
          />
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-2.5">
          <SectionTitle>Pickup Info</SectionTitle>
          <Row label="Pickup Name and Phone:" value={<RevealableSensitiveValue value={pickupNamesPhones} />} />
          <Row label="Pickup Address:" value={<RevealableSensitiveValue value={pickupAddresses} />} />
          <Row
            label="Original Pickup Address:"
            value={
              <span className="text-slate-400" title="No separate field in DB; not the same as edited pickup address">
                —
              </span>
            }
            muted
          />
          <Row
            label="Seller Days to Ship:"
            value={
              sellerDaysLabel ? (
                <span className="text-slate-700">{sellerDaysLabel}</span>
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
            muted={!sellerDaysLabel}
          />
          <Row
            label="Arrange Pickup Time:"
            value={
              arrangeLabel ? (
                <span className="text-slate-700">{arrangeLabel}</span>
              ) : (
                <span className="text-slate-400" title="From status history: first Confirmed or Preparing">
                  —
                </span>
              )
            }
            muted={!arrangeLabel}
          />
          <Row
            label="Actual Pickup Time:"
            value={
              actualLabel ? (
                <span className="text-slate-700">{actualLabel}</span>
              ) : (
                <span
                  className="text-slate-400"
                  title="From status history: ReadyForPickup / OutForDelivery, else DeliveredAt"
                >
                  —
                </span>
              )
            }
            muted={!actualLabel}
          />
          <Row
            label="Pickup Remark:"
            value={
              pickupRemarkFromNote ? (
                <RevealableSensitiveValue value={pickupRemarkFromNote} />
              ) : (
                <span className="text-slate-400" title="Self-delivery: same as delivery note when present">
                  —
                </span>
              )
            }
            muted={!pickupRemarkFromNote}
          />
        </div>
      </div>
    </div>
  );
}
