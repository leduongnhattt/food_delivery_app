/**
 * Computes the voucher discount in USD for checkout UI and totals.
 * Matches server rules: min order on subtotal; percent vs fixed amount;
 * percent takes precedence when both are set (misconfiguration).
 */
export type CheckoutVoucherRule = {
  discountAmount?: number | null
  discountPercent?: number | null
  minOrderValue?: number | null
}

export function computeCheckoutVoucherDiscountUsd(
  subtotal: number,
  rule: CheckoutVoucherRule | null | undefined,
): number {
  if (!rule) return 0
  const sub = Number(subtotal)
  if (!Number.isFinite(sub) || sub <= 0) return 0

  const minRaw = rule.minOrderValue
  const min =
    minRaw != null && Number.isFinite(Number(minRaw)) ? Math.max(0, Number(minRaw)) : 0
  if (min > 0 && sub < min) return 0

  const pctRaw = rule.discountPercent
  const pct =
    pctRaw != null && Number.isFinite(Number(pctRaw)) ? Number(pctRaw) : 0

  const amtRaw = rule.discountAmount
  const amt =
    amtRaw != null && Number.isFinite(Number(amtRaw)) ? Number(amtRaw) : 0

  if (pct > 0) {
    const raw = sub * (pct / 100)
    return Math.round(Math.min(sub, raw) * 100) / 100
  }
  if (amt > 0) {
    return Math.round(Math.min(sub, amt) * 100) / 100
  }
  return 0
}
