"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/toast-context";
import { orderManagementService, type Order } from "@/services/order-management.service";
import { EnterprisePageHeader, ENTERPRISE_PANEL_CLASS } from "@/components/enterprise/EnterprisePageHeader";
import {
  cancelReasonLabelShort,
  compactId,
  initials,
  pickMetaBool,
  pickMetaString,
} from "@/lib/enterprise-orders";
import { useDismissablePopover } from "@/hooks/ui-hooks";
import { CopyToClipboardButton } from "@/components/enterprise/CopyToClipboardButton";
import {
  EnterpriseMenuSelect,
  type EnterpriseMenuSelectOption,
} from "@/components/enterprise/orders/shared/EnterpriseMenuSelect";

function norm(s: string | null | undefined): string {
  return (s || "").trim().toLowerCase();
}

const DATE_OPTIONS = [
  { value: "all" as const, label: "All time" },
  { value: "today" as const, label: "Today" },
  { value: "last_7" as const, label: "Last 7 days" },
  { value: "last_30" as const, label: "Last 30 days" },
] as const;

const REASON_OPTIONS = [
  { value: "all" as const, label: "All reasons" },
  { value: "accept_timeout" as const, label: "Auto-cancelled (not accepted in time)" },
  { value: "customer_cancelled" as const, label: "Cancelled by customer" },
  { value: "enterprise_cancelled" as const, label: "Cancelled by enterprise" },
  { value: "payment_failed" as const, label: "Payment failed" },
  { value: "out_of_stock" as const, label: "Out of stock" },
  { value: "other" as const, label: "Other" },
] as const;

const KNOWN_REASON_CODES = new Set([
  "accept_timeout",
  "customer_cancelled",
  "enterprise_cancelled",
  "payment_failed",
  "out_of_stock",
]);

type DateRangeKey = (typeof DATE_OPTIONS)[number]["value"];
type ReasonFilterKey = (typeof REASON_OPTIONS)[number]["value"];

function getDateWindow(key: DateRangeKey): { start: Date | null; end: Date | null } {
  const now = new Date();
  if (key === "all") return { start: null, end: null };
  if (key === "today") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
      end: now,
    };
  }
  if (key === "last_7") return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now };
  return { start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), end: now };
}

function matchesReasonFilter(reasonCode: string, filter: ReasonFilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "other") return reasonCode !== "" && !KNOWN_REASON_CODES.has(reasonCode);
  return reasonCode === filter;
}

type CancellationSearchField = "order_id" | "buyer_name";

const CANCELLATION_SEARCH_OPTIONS: EnterpriseMenuSelectOption[] = [
  { value: "order_id", label: "Order ID" },
  { value: "buyer_name", label: "Buyer name" },
];

const CANCELLATION_SEARCH_PLACEHOLDER: Record<CancellationSearchField, string> = {
  order_id: "Input order ID",
  buyer_name: "Input buyer name or username",
};

function matchesCancellationSearch(
  order: Order,
  field: CancellationSearchField,
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  switch (field) {
    case "order_id":
      return order.id.toLowerCase().includes(needle);
    case "buyer_name":
      return (
        (order.customerName ?? "").toLowerCase().includes(needle) ||
        (order.customerUsername ?? "").toLowerCase().includes(needle)
      );
  }
}

export function EnterpriseOrderCancellationPageClient() {
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const [searchField, setSearchField] = useState<CancellationSearchField>("order_id");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangeKey, setDateRangeKey] = useState<DateRangeKey>("all");
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const dateMenuRef = useRef<HTMLDivElement | null>(null);

  const [reasonFilterKey, setReasonFilterKey] = useState<ReasonFilterKey>("all");
  const [isReasonMenuOpen, setIsReasonMenuOpen] = useState(false);
  const reasonMenuRef = useRef<HTMLDivElement | null>(null);

  const reasonLabel = useMemo(() => {
    return REASON_OPTIONS.find((o) => o.value === reasonFilterKey)?.label ?? "All reasons";
  }, [reasonFilterKey]);

  const dateLabel = useMemo(() => {
    return DATE_OPTIONS.find((o) => o.value === dateRangeKey)?.label ?? "Date range";
  }, [dateRangeKey]);

  useDismissablePopover(isDateMenuOpen, dateMenuRef, () => setIsDateMenuOpen(false));
  useDismissablePopover(isReasonMenuOpen, reasonMenuRef, () => setIsReasonMenuOpen(false));

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const data = await orderManagementService.fetchOrders();
        if (!cancelled) setAllOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) showToast("Failed to load cancellations", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  const cancelledOnlyOrders = useMemo(() => {
    return allOrders.filter((o) => norm(o.status) === "cancelled");
  }, [allOrders]);

  const visibleOrders = useMemo(() => {
    const { start, end } = getDateWindow(dateRangeKey);
    return cancelledOnlyOrders.filter((o) => {
      const meta = o.metadata;
      const reasonCode = pickMetaString(meta, "cancelReason")?.trim().toLowerCase() || "";
      if (!matchesReasonFilter(reasonCode, reasonFilterKey)) return false;

      const cancelledAtIso = pickMetaString(meta, "cancelledAt");
      const when = cancelledAtIso ? new Date(cancelledAtIso) : new Date(o.createdAt);
      if (start && when < start) return false;
      if (end && when > end) return false;

      if (!matchesCancellationSearch(o, searchField, searchQuery)) return false;

      return true;
    });
  }, [cancelledOnlyOrders, dateRangeKey, reasonFilterKey, searchField, searchQuery]);

  return (
    <div className="w-full space-y-6">
      <EnterprisePageHeader
        title="Order Cancellation"
        description="Monitor cancelled orders and refund pending status."
      />

      <div className={`${ENTERPRISE_PANEL_CLASS} px-3 py-3 sm:px-4`}>
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-200 pb-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Search</label>
            <div className="flex min-w-0 items-stretch rounded border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-300">
              <EnterpriseMenuSelect
                value={searchField}
                onChange={(v) => setSearchField(v as CancellationSearchField)}
                options={CANCELLATION_SEARCH_OPTIONS}
                className="w-40 shrink-0"
                borderlessTrigger
                triggerClassName="rounded-none rounded-l-md rounded-r-none"
                aria-label="Search by field"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={CANCELLATION_SEARCH_PLACEHOLDER[searchField]}
                className="h-9 min-h-9 min-w-0 flex-1 rounded-none rounded-r-md border-0 border-l border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Date range</label>
            <div ref={dateMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsDateMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isDateMenuOpen}
                className={[
                  "flex h-9 min-w-[240px] items-center justify-between gap-3 rounded border bg-white px-3 text-sm text-gray-900",
                  "border-slate-200 hover:bg-slate-50",
                  "focus:outline-none focus:ring-2 focus:ring-sky-300",
                ].join(" ")}
              >
                <span className="truncate">{dateLabel}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={[
                    "h-4 w-4 text-slate-400 transition-transform",
                    isDateMenuOpen ? "rotate-180" : "",
                  ].join(" ")}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isDateMenuOpen ? (
                <div
                  role="menu"
                  aria-label="Date range options"
                  className="absolute left-0 z-30 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                >
                  {DATE_OPTIONS.map((opt) => {
                    const active = opt.value === dateRangeKey;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => {
                          setDateRangeKey(opt.value);
                          setIsDateMenuOpen(false);
                        }}
                        className={[
                          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm",
                          active ? "bg-slate-50 text-slate-900" : "text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <span className="truncate">{opt.label}</span>
                        <span className="w-5 text-right">
                          {active ? (
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-4 w-4 text-slate-700"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.07 7.1a1 1 0 0 1-1.42.006L3.29 8.88a1 1 0 1 1 1.414-1.414l4.22 4.22 6.362-6.395a1 1 0 0 1 1.418 0Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Reason</label>
            <div ref={reasonMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsReasonMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isReasonMenuOpen}
                className={[
                  "flex h-9 min-w-[240px] items-center justify-between gap-3 rounded border bg-white px-3 text-sm text-gray-900",
                  "border-slate-200 hover:bg-slate-50",
                  "focus:outline-none focus:ring-2 focus:ring-sky-300",
                ].join(" ")}
              >
                <span className="truncate">{reasonLabel}</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={[
                    "h-4 w-4 text-slate-400 transition-transform",
                    isReasonMenuOpen ? "rotate-180" : "",
                  ].join(" ")}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {isReasonMenuOpen ? (
                <div
                  role="menu"
                  aria-label="Reason filter options"
                  className="absolute left-0 z-30 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                >
                  {REASON_OPTIONS.map((opt) => {
                    const active = opt.value === reasonFilterKey;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={active}
                        onClick={() => {
                          setReasonFilterKey(opt.value);
                          setIsReasonMenuOpen(false);
                        }}
                        className={[
                          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm",
                          active ? "bg-slate-50 text-slate-900" : "text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <span className="truncate">{opt.label}</span>
                        <span className="w-5 text-right">
                          {active ? (
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-4 w-4 text-slate-700"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.07 7.1a1 1 0 0 1-1.42.006L3.29 8.88a1 1 0 1 1 1.414-1.414l4.22 4.22 6.362-6.395a1 1 0 0 1 1.418 0Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {/* Count intentionally hidden (per UI request). */}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr className="border-b border-gray-200">
                <th className="w-[520px] px-3 py-2 text-left font-medium">Customer / Order</th>
                <th className="w-[140px] px-3 py-2 text-left font-medium">Amount</th>
                <th className="w-[170px] px-3 py-2 text-left font-medium">Cancelled at</th>
                <th className="px-3 py-2 text-left font-medium">Reason</th>
                <th className="w-[160px] px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-gray-500">
                    No cancellations match the current filters.
                  </td>
                </tr>
              ) : (
                visibleOrders.map((o) => {
                  const meta = o.metadata;
                  const cancelledAtIso = pickMetaString(meta, "cancelledAt");
                  const cancelReason = pickMetaString(meta, "cancelReason");
                  const refundPending = pickMetaBool(meta, "refundPending");
                  const first = o.orderDetails?.[0];
                  const more = Math.max(0, (o.orderDetails?.length ?? 0) - 1);
                  return (
                    <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center justify-center mt-0.5">
                            {initials(o.customerName ?? null)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2 text-sm text-gray-900">
                              <span className="font-medium truncate max-w-[220px]">{o.customerName || "—"}</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-600 shrink-0">Order ID:</span>
                              <span className="inline-flex min-w-0 items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => router.push(`/enterprise/orders/order-cancellation/${encodeURIComponent(o.id)}`)}
                                  className="font-medium text-[#2563FF] underline decoration-[#2563FF] underline-offset-4 truncate max-w-[360px] text-left hover:text-[#1d4ed8]"
                                  title={o.id}
                                >
                                  {compactId(o.id, 8)}
                                </button>
                                <CopyToClipboardButton text={o.id} label="Order ID" />
                              </span>
                            </div>
                            {first ? (
                              <div className="mt-3 flex items-start gap-3">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                                  {first.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={first.imageUrl} alt="" className="h-full w-full object-cover" />
                                  ) : null}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <div className="truncate text-sm font-medium text-gray-900">
                                      {first.dishName ?? "—"}
                                    </div>
                                    <div className="text-sm text-gray-600">x{first.quantity ?? 1}</div>
                                  </div>
                                  {more > 0 ? (
                                    <div className="mt-0.5 text-xs text-gray-500">+{more} more item(s)</div>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-gray-900">
                        {orderManagementService.formatCurrency(o.totalAmount)}
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        {orderManagementService.formatDate(cancelledAtIso || o.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-gray-700">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-gray-900">{cancelReasonLabelShort(cancelReason)}</span>
                          {refundPending ? (
                            <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                              Refund pending
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/enterprise/orders/order-cancellation/${encodeURIComponent(o.id)}`}
                            className="text-sm font-medium text-[#0070f0] hover:text-[#0050c0] hover:underline"
                          >
                            View
                          </Link>
                          {refundPending ? (
                            <Link
                              href="/enterprise/orders/returns-refunds"
                              className="h-8 rounded bg-[#2563FF] px-3 text-xs font-medium text-white hover:bg-[#1d4ed8] inline-flex items-center"
                            >
                              Go to refund
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

