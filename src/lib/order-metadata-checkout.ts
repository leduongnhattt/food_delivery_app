import type { AdminOrderDetail } from "@/types/admin-api.types";
import { parseFiniteNumber } from "@/lib/utils";

/**
 * `Order.Metadata.checkout` — written by food-delivery-server on checkout (Stripe attempt + `createOrderWithDetailsAndPayment`).
 */
export type OrderMetadataCheckout = {
  subtotal?: number;
  deliveryFee?: number;
  voucherDiscount?: number;
};

function numUnknown(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function parseOrderMetadataCheckout(metadata: unknown): OrderMetadataCheckout | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const checkout = (metadata as Record<string, unknown>).checkout;
  if (!checkout || typeof checkout !== "object" || Array.isArray(checkout)) return null;
  const o = checkout as Record<string, unknown>;
  return {
    subtotal: numUnknown(o.subtotal),
    deliveryFee: numUnknown(o.deliveryFee),
    voucherDiscount: numUnknown(o.voucherDiscount),
  };
}

/**
 * Prefer `Metadata.checkout.deliveryFee`. For **legacy** orders without that snapshot, when there is
 * **no voucher** on the order, approximate shipping as `TotalAmount − Σ(SubTotal)` (fees/tax not modeled separately).
 */
export function resolveBuyerPaidShippingFee(order: AdminOrderDetail): number | null {
  const c = parseOrderMetadataCheckout(order.Metadata ?? null);
  if (c?.deliveryFee != null && Number.isFinite(c.deliveryFee)) return c.deliveryFee;

  if (order.voucher) return null;

  const itemsSub = order.orderDetails.reduce((acc, d) => acc + parseFiniteNumber(d.SubTotal), 0);
  const total = parseFiniteNumber(order.TotalAmount as number | string);
  const diff = Math.round((total - itemsSub) * 100) / 100;
  if (!Number.isFinite(diff) || diff < 0) return null;
  return diff;
}

/** e.g. `SelfDelivery` from `Order.Metadata` (enterprise / order flow). */
export function parseOrderDeliveryMethod(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const raw = (metadata as Record<string, unknown>).deliveryMethod;
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw.trim();
}

export function isSelfDeliveryMetadata(metadata: unknown): boolean {
  const m = parseOrderDeliveryMethod(metadata);
  if (!m) return false;
  return m.toLowerCase().includes("self");
}
