import type { AdminOrderDetail } from "@/types/admin-api.types";
import { formatPrice, parseOptionalFiniteNumber } from "@/lib/utils";

export type AdminOrderVoucher = NonNullable<AdminOrderDetail["voucher"]>;

/** Voucher rule as shown in admin (not necessarily the exact settled discount without line items). */
export function adminVoucherRuleLabel(v: AdminOrderVoucher | null | undefined): string {
  if (!v) return "—";
  const amt = parseOptionalFiniteNumber(v.DiscountAmount);
  const pct = parseOptionalFiniteNumber(v.DiscountPercent);
  if (amt != null && amt > 0) return formatPrice(amt);
  if (pct != null && pct > 0) return `${pct}%`;
  return "—";
}

export function adminVoucherIsShop(v: AdminOrderVoucher | null | undefined): boolean {
  return !!v?.EnterpriseID?.trim();
}

export function adminVoucherIsPlatform(v: AdminOrderVoucher | null | undefined): boolean {
  return !!v && !v.EnterpriseID?.trim();
}
