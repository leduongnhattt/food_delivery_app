/**
 * Pickup / seller timeline hints from `Order.Metadata.statusHistory` (written by enterprise flows).
 * There is **no** dedicated DB column for "original pickup address", SLA days, or arrange pickup — only heuristics.
 */

export type OrderStatusHistoryEntry = {
  at: string;
  status: string;
  actor?: string;
};

function normStatus(s: string): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function parseOrderStatusHistory(metadata: unknown): OrderStatusHistoryEntry[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const raw = (metadata as Record<string, unknown>).statusHistory;
  if (!Array.isArray(raw)) return [];
  const out: OrderStatusHistoryEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const at = typeof o.at === "string" ? o.at : "";
    const status = typeof o.status === "string" ? o.status : "";
    if (!at || !status) continue;
    out.push({
      at,
      status,
      actor: typeof o.actor === "string" ? o.actor : undefined,
    });
  }
  return out.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

function firstStatusAt(
  entries: OrderStatusHistoryEntry[],
  predicate: (norm: string) => boolean,
): string | null {
  for (const e of entries) {
    if (predicate(normStatus(e.status))) return e.at;
  }
  return null;
}

/** First seller-side acknowledgment (Confirmed, else Preparing). */
export function pickupArrangeAtIso(metadata: unknown): string | null {
  const h = parseOrderStatusHistory(metadata);
  return (
    firstStatusAt(h, (n) => n === "confirmed") ??
    firstStatusAt(h, (n) => n === "preparing") ??
    null
  );
}

/** Handoff from shop: ReadyForPickup or OutForDelivery. */
export function pickupHandoffAtIso(metadata: unknown): string | null {
  const h = parseOrderStatusHistory(metadata);
  return (
    firstStatusAt(h, (n) => n === "readyforpickup") ??
    firstStatusAt(h, (n) => n === "outfordelivery") ??
    null
  );
}

/**
 * Elapsed from `OrderDate` to first handoff status (see `pickupHandoffAtIso`), else `deliveredAt` fallback.
 * Returns a short human string, or null if not computable.
 */
export function sellerLeadTimeLabel(
  orderDateIso: string,
  metadata: unknown,
  deliveredAtIso?: string | null,
): string | null {
  const placed = new Date(orderDateIso).getTime();
  if (!Number.isFinite(placed)) return null;

  const handoffIso = pickupHandoffAtIso(metadata) ?? deliveredAtIso ?? null;
  if (!handoffIso) return null;
  const t = new Date(handoffIso).getTime();
  if (!Number.isFinite(t) || t < placed) return null;

  const ms = t - placed;
  const hours = ms / 3_600_000;
  if (hours < 72) return `≈ ${hours.toFixed(1)} h (order → handoff)`;
  const days = ms / 86_400_000;
  return `≈ ${days.toFixed(1)} day(s) (order → handoff)`;
}
