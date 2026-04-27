/**
 * Primary tabs for Enterprise "My Orders" (Shopee-style buckets).
 * Maps to OrderStatus + PaymentStatus without changing DB enum.
 */

export type EnterpriseOrderTab =
  | "all"
  | "unpaid"
  | "to_ship"
  | "shipping"
  | "completed"
  | "return_refund";

/** Sub-filter when tab === to_ship */
export type EnterpriseToShipSubTab = "all" | "to_process" | "processed";

export interface EnterpriseOrderListItem {
  id: string;
  customerName: string;
  customerUsername?: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: number;
  deliveryAddress: string;
  phoneNumber?: string | null;
  customerAddress?: string | null;
  metadata?: unknown;
  orderDetails: Array<{
    dishName: string;
    foodId?: string;
    quantity: number;
    subTotal: number;
    imageUrl?: string | null;
    variantLabel?: string | null;
    sku?: string | null;
    parentSku?: string | null;
  }>;
  estimatedDeliveryTime?: string | null;
  paymentId?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
}

function norm(s: string | null | undefined): string {
  return (s || "").trim().toLowerCase();
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function hasReturnRefund(order: EnterpriseOrderListItem): boolean {
  const metadata = order.metadata;
  if (!isPlainObject(metadata)) return false;
  const returnRequestIdRaw = (metadata as any).returnRequestId;
  const refundPendingRaw = (metadata as any).refundPending;
  return (
    (typeof returnRequestIdRaw === "string" && returnRequestIdRaw.trim().length > 0) ||
    refundPendingRaw === true
  );
}

/**
 * Whether this order belongs to the "Unpaid" bucket (pending checkout / not paid).
 */
export function isUnpaidBucket(order: EnterpriseOrderListItem): boolean {
  const statusNorm = norm(order.status);
  const paymentStatusNorm = norm(order.paymentStatus);
  return statusNorm === "pending" && (paymentStatusNorm === "pending" || paymentStatusNorm === "" || paymentStatusNorm === "failed");
}

export function matchesEnterpriseTab(
  order: EnterpriseOrderListItem,
  tab: EnterpriseOrderTab,
  toShipSub: EnterpriseToShipSubTab,
): boolean {
  const statusNorm = norm(order.status);

  switch (tab) {
    case "all":
      return true;
    case "unpaid":
      return isUnpaidBucket(order);
    case "to_ship": {
      if (!["confirmed", "preparing", "readyforpickup"].includes(statusNorm)) {
        return false;
      }
      if (toShipSub === "all") return true;
      if (toShipSub === "to_process") return statusNorm === "confirmed";
      if (toShipSub === "processed") return statusNorm === "readyforpickup";
      return true;
    }
    case "shipping":
      return statusNorm === "outfordelivery";
    case "completed":
      return statusNorm === "delivered" || statusNorm === "completed";
    case "return_refund":
      return statusNorm === "cancelled" || statusNorm === "refunded" || hasReturnRefund(order);
    default:
      return true;
  }
}

export const ENTERPRISE_TAB_LABELS: Record<EnterpriseOrderTab, string> = {
  all: "All",
  unpaid: "Unpaid",
  to_ship: "To Ship",
  shipping: "Shipping",
  completed: "Completed",
  return_refund: "Return / Refund / Cancel",
};

export const TOSHIP_SUB_LABELS: Record<EnterpriseToShipSubTab, string> = {
  all: "All",
  to_process: "To Process",
  processed: "Processed",
};

export function parseTabFromQuery(
  raw: string | null | undefined,
): EnterpriseOrderTab {
  const normalized = (raw || "all").toLowerCase().replace(/-/g, "_");
  const allowed: EnterpriseOrderTab[] = [
    "all",
    "unpaid",
    "to_ship",
    "shipping",
    "completed",
    "return_refund",
  ];
  return (allowed.includes(normalized as EnterpriseOrderTab)
    ? normalized
    : "all") as EnterpriseOrderTab;
}

export function parseToShipSubFromQuery(
  raw: string | null | undefined,
): EnterpriseToShipSubTab {
  const normalized = (raw || "all").toLowerCase().replace(/-/g, "_");
  const allowed: EnterpriseToShipSubTab[] = ["all", "to_process", "processed"];
  return (allowed.includes(normalized as EnterpriseToShipSubTab)
    ? normalized
    : "all") as EnterpriseToShipSubTab;
}

// ==== enterprise-ui-helpers.ts ====

export function initials(name: string | null | undefined): string {
  const trimmedName = (name || "").trim();
  if (!trimmedName) return "—";

  const parts = trimmedName.split(/\s+/).filter(Boolean);
  const firstInitial = parts[0]?.[0] ?? "";
  const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  const initialsText = (firstInitial + lastInitial).toUpperCase();

  return initialsText || (trimmedName[0] ?? "—").toUpperCase();
}

export function compactId(id: string | null | undefined, max = 8): string {
  const trimmedId = (id || "").trim();
  if (!trimmedId) return "—";
  return trimmedId.length > max ? trimmedId.slice(0, max) : trimmedId;
}

export function shortId(id: string): string {
  const trimmedId = (id || "").trim();
  return trimmedId.length > 10 ? `#${trimmedId.slice(-8)}` : trimmedId;
}

export function pickMetaString(meta: unknown, key: string): string | null {
  if (!isPlainObject(meta)) return null;
  const raw = (meta as any)[key];
  return typeof raw === "string" && raw.trim() ? raw : null;
}

export function pickMetaBool(meta: unknown, key: string): boolean {
  if (!isPlainObject(meta)) return false;
  return Boolean((meta as any)[key]);
}

export function cancelReasonLabel(code: string | null | undefined): string {
  const normalizedCode = (code || "").trim().toLowerCase();
  if (!normalizedCode) return "Cancellation reason is not available.";
  if (normalizedCode === "accept_timeout") return "Auto-cancelled (not accepted in time).";
  if (normalizedCode === "customer_cancelled") return "Cancelled by customer.";
  if (normalizedCode === "enterprise_cancelled") return "Cancelled by enterprise.";
  if (normalizedCode === "payment_failed") return "Payment failed.";
  if (normalizedCode === "out_of_stock") return "Out of stock.";
  return "Cancellation reason is not available.";
}

export function cancelReasonLabelShort(code: string | null | undefined): string {
  const normalizedCode = (code || "").trim().toLowerCase();
  if (!normalizedCode) return "—";
  if (normalizedCode === "accept_timeout") return "Auto-cancelled (not accepted in time)";
  if (normalizedCode === "customer_cancelled") return "Cancelled by customer";
  if (normalizedCode === "enterprise_cancelled") return "Cancelled by enterprise";
  if (normalizedCode === "payment_failed") return "Payment failed";
  if (normalizedCode === "out_of_stock") return "Out of stock";
  return "Other";
}

