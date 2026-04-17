"use client";

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

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
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

