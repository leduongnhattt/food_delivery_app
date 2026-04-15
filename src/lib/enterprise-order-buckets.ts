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
    quantity: number;
    subTotal: number;
    imageUrl?: string | null;
    /** If your API adds product options later, show as "Variation: …". */
    variantLabel?: string | null;
  }>;
  /** ISO datetime for "Ship by …" line (optional). */
  estimatedDeliveryTime?: string | null;
  paymentId?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
}

function norm(s: string | null | undefined): string {
  return (s || "").trim().toLowerCase();
}

/**
 * Whether this order belongs to the "Unpaid" bucket (pending checkout / not paid).
 */
export function isUnpaidBucket(order: EnterpriseOrderListItem): boolean {
  const st = norm(order.status);
  const ps = norm(order.paymentStatus);
  return st === "pending" && (ps === "pending" || ps === "" || ps === "failed");
}

export function matchesEnterpriseTab(
  order: EnterpriseOrderListItem,
  tab: EnterpriseOrderTab,
  toShipSub: EnterpriseToShipSubTab,
): boolean {
  const st = norm(order.status);

  switch (tab) {
    case "all":
      return true;
    case "unpaid":
      return isUnpaidBucket(order);
    case "to_ship": {
      if (!["confirmed", "preparing", "readyforpickup"].includes(st)) {
        return false;
      }
      if (toShipSub === "all") return true;
      if (toShipSub === "to_process") return st === "confirmed";
      if (toShipSub === "processed") return st === "readyforpickup";
      return true;
    }
    case "shipping":
      return st === "outfordelivery";
    case "completed":
      return st === "delivered" || st === "completed";
    case "return_refund":
      return st === "cancelled" || st === "refunded";
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
  const v = (raw || "all").toLowerCase().replace(/-/g, "_");
  const allowed: EnterpriseOrderTab[] = [
    "all",
    "unpaid",
    "to_ship",
    "shipping",
    "completed",
    "return_refund",
  ];
  return (allowed.includes(v as EnterpriseOrderTab)
    ? v
    : "all") as EnterpriseOrderTab;
}

export function parseToShipSubFromQuery(
  raw: string | null | undefined,
): EnterpriseToShipSubTab {
  const v = (raw || "all").toLowerCase().replace(/-/g, "_");
  const allowed: EnterpriseToShipSubTab[] = ["all", "to_process", "processed"];
  return (allowed.includes(v as EnterpriseToShipSubTab)
    ? v
    : "all") as EnterpriseToShipSubTab;
}
