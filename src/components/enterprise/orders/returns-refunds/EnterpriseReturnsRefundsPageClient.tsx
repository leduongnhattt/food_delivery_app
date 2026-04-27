"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { EnterprisePageHeader, ENTERPRISE_PANEL_CLASS } from "@/components/enterprise/EnterprisePageHeader";
import {
  EnterpriseReturnsService,
  type EnterpriseReturnRequestRow,
  type ReturnRequestStatus,
} from "@/services/enterprise-returns.service";
import { ConfirmActionModal } from "@/components/enterprise/ConfirmActionModal";
import { compactId, initials, shortId } from "@/lib/enterprise-orders";
import {
  DropdownSelect,
  type DropdownSelectOption,
} from "@/components/ui/dropdown-select";
import { Pagination } from "@/components/ui/pagination";

type TabKey = "All" | "Approved" | "Rejected" | "Completed";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "All", label: "All" },
  { key: "Approved", label: "Approved" },
  { key: "Rejected", label: "Rejected" },
  { key: "Completed", label: "Completed" },
];

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function statusBadge(status: ReturnRequestStatus) {
  const s = status;
  const base = "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";
  if (s === "PendingReview") return `${base} border-amber-200 bg-amber-50 text-amber-700`;
  if (s === "Approved") return `${base} border-green-200 bg-green-50 text-green-700`;
  if (s === "Rejected") return `${base} border-red-200 bg-red-50 text-red-700`;
  if (s === "Completed") return `${base} border-slate-200 bg-slate-50 text-slate-700`;
  return `${base} border-gray-200 bg-white text-gray-700`;
}

function reasonLabel(code: string): string {
  switch (code) {
    case "missing_items":
      return "Missing item(s)";
    case "wrong_item":
      return "Wrong item";
    case "quality_issue":
      return "Quality issue";
    case "damaged_spill":
      return "Damaged / spill";
    case "late_delivery":
      return "Late delivery";
    case "other":
    default:
      return "Other";
  }
}

function solutionLabel(s: string): string {
  if (s === "Replace") return "Replace";
  if (s === "StoreCredit") return "Store credit";
  return "Refund only";
}

type ReturnsSearchField = "order_id" | "buyer_name";

const RETURNS_SEARCH_OPTIONS: DropdownSelectOption[] = [
  { value: "order_id", label: "Order ID" },
  { value: "buyer_name", label: "Buyer name" },
];

const RETURNS_SEARCH_PLACEHOLDER: Record<ReturnsSearchField, string> = {
  order_id: "Input order ID",
  buyer_name: "Input buyer name",
};

function matchesSearch(
  r: EnterpriseReturnRequestRow,
  field: ReturnsSearchField,
  q: string,
): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  switch (field) {
    case "order_id":
      return r.orderId.toLowerCase().includes(t);
    case "buyer_name":
      return (r.customer?.name ?? "").toLowerCase().includes(t);
  }
}

export function EnterpriseReturnsRefundsPageClient() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("All");
  const [rows, setRows] = useState<EnterpriseReturnRequestRow[]>([]);

  const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(12);

  const [pendingSearchField, setPendingSearchField] = useState<ReturnsSearchField>("order_id");
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingRefundPendingOnly, setPendingRefundPendingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    "requested_earliest" | "requested_latest" | "updated_latest"
  >("requested_latest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortWrapRef = useRef<HTMLDivElement | null>(null);

  const [saving, setSaving] = useState<null | "Approved" | "Rejected">(null);
  const [confirmCtx, setConfirmCtx] = useState<null | {
    status: "Approved" | "Rejected";
    returnRequestId: string;
  }>(null);

  const sortOptions: Array<{
    value: "requested_earliest" | "requested_latest" | "updated_latest";
    label: string;
  }> = useMemo(
    () => [
      { value: "requested_earliest", label: "Request date (Earliest first)" },
      { value: "requested_latest", label: "Request date (Latest first)" },
      { value: "updated_latest", label: "Last updated (Latest first)" },
    ],
    [],
  );

  const sortLabel = useMemo(() => {
    return sortOptions.find((o) => o.value === sortBy)?.label ?? "Sort";
  }, [sortBy, sortOptions]);

  useEffect(() => {
    if (!sortOpen) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = sortWrapRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && el.contains(target)) return;
      setSortOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [sortOpen]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await EnterpriseReturnsService.list({
        status: "All",
      });
      setRows(Array.isArray(res?.returns) ? res.returns : []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load return requests", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const visible = useMemo(() => {
    const base = rows.filter((r) => {
      if (pendingRefundPendingOnly && !r.order?.refundPending) return false;
      if (!matchesSearch(r, pendingSearchField, pendingSearch)) return false;
      return true;
    });
    const tabbed = tab === "All" ? base : base.filter((r) => r.status === tab);
    const toMs = (iso: string | null | undefined) => {
      if (!iso) return 0;
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    };
    const sorted = [...tabbed].sort((a, b) => {
      if (sortBy === "requested_latest") {
        return toMs(b.requestedAt) - toMs(a.requestedAt);
      }
      if (sortBy === "updated_latest") {
        return toMs(b.updatedAt) - toMs(a.updatedAt);
      }
      // requested_earliest
      return toMs(a.requestedAt) - toMs(b.requestedAt);
    });
    return sorted;
  }, [pendingRefundPendingOnly, pendingSearch, pendingSearchField, rows, sortBy, tab]);

  useEffect(() => {
    setPage(1);
  }, [pendingRefundPendingOnly, pendingSearch, pendingSearchField, sortBy, tab]);

  const pagedVisible = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return visible.slice(start, start + pageSize);
  }, [page, pageSize, visible]);

  const counts = useMemo(() => {
    const base = rows.filter((r) => {
      if (pendingRefundPendingOnly && !r.order?.refundPending) return false;
      if (!matchesSearch(r, pendingSearchField, pendingSearch)) return false;
      return true;
    });
    const c: Record<TabKey, number> = {
      All: base.length,
      Approved: base.filter((r) => r.status === "Approved").length,
      Rejected: base.filter((r) => r.status === "Rejected").length,
      Completed: base.filter((r) => r.status === "Completed").length,
    };
    return c;
  }, [pendingRefundPendingOnly, pendingSearch, pendingSearchField, rows]);

  const openConfirmFromRow = (r: EnterpriseReturnRequestRow, status: "Approved" | "Rejected") => {
    if (saving) return;
    setConfirmCtx({ status, returnRequestId: r.id });
  };

  const runConfirmed = async () => {
    if (!confirmCtx) return;
    const { status, returnRequestId } = confirmCtx;
    try {
      setSaving(status);
      await EnterpriseReturnsService.updateStatus(returnRequestId, {
        status,
      });
      showToast(status === "Approved" ? "Return request approved" : "Return request rejected", "success");
      setConfirmCtx(null);
      await fetchList();
    } catch (e) {
      console.error(e);
      showToast("Failed to update return request", "error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <EnterprisePageHeader
        title="Return / Refund"
        description="Review return requests submitted by customers."
      />

      <div className={`${ENTERPRISE_PANEL_CLASS} px-3 py-3 sm:px-4`}>
        {/* Header controls (MallPlus-like) */}
        <div className="space-y-3 border-b border-gray-200 pb-4">
          {/* Tabs row (MallPlus-like) */}
          <div className="flex flex-wrap items-center gap-7 border-b border-gray-200">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={[
                    "relative -mb-px inline-flex items-center gap-1 px-1 py-3 text-sm font-medium",
                    active
                      ? "text-[#2563FF]"
                      : "text-gray-600 hover:text-gray-900",
                  ].join(" ")}
                >
                  <span>{t.label}</span>
                  <span className={active ? "text-[#2563FF]" : "text-gray-500"}>
                    ({counts[t.key]})
                  </span>
                  {active ? (
                    <span
                      className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#2563FF]"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Search row + sort (search filters as you type, like My Orders) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 items-stretch rounded border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-300">
              <DropdownSelect
                value={pendingSearchField}
                onChange={(v) => setPendingSearchField(v as ReturnsSearchField)}
                options={RETURNS_SEARCH_OPTIONS}
                className="w-40 shrink-0"
                borderlessTrigger
                triggerClassName="rounded-none rounded-l-md rounded-r-none"
                aria-label="Search by field"
              />
              <input
                value={pendingSearch}
                onChange={(e) => setPendingSearch(e.target.value)}
                placeholder={RETURNS_SEARCH_PLACEHOLDER[pendingSearchField]}
                className="h-9 min-h-9 min-w-0 flex-1 rounded-none rounded-r-md border-0 border-l border-slate-200 bg-white px-3 text-sm text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:ml-auto sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:min-w-[260px]">
              <span className="shrink-0 text-sm text-gray-600">Sort by:</span>
              <div ref={sortWrapRef} className="relative min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={sortOpen}
                  className={[
                    "flex h-9 min-w-[260px] items-center justify-between gap-3 rounded border bg-white px-3 text-sm text-gray-900",
                    "border-slate-200 hover:bg-slate-50",
                    "focus:outline-none focus:ring-2 focus:ring-sky-300",
                  ].join(" ")}
                >
                  <span className="truncate">{sortLabel}</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={[
                      "h-4 w-4 text-slate-400 transition-transform",
                      sortOpen ? "rotate-180" : "",
                    ].join(" ")}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {sortOpen ? (
                  <div
                    role="menu"
                    aria-label="Sort options"
                    className="absolute left-0 z-30 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                  >
                    {sortOptions.map((opt) => {
                      const active = opt.value === sortBy;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          onClick={() => {
                            setSortBy(opt.value);
                            setSortOpen(false);
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

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="h-9 rounded border border-[#2563FF] bg-white px-4 text-sm text-[#2563FF] hover:bg-[#2563FF] hover:text-white"
                  onClick={() => void fetchList()}
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="h-9 rounded border border-gray-300 bg-white px-4 text-sm text-gray-900 hover:bg-gray-50"
                  onClick={() => {
                    setPendingSearchField("order_id");
                    setPendingSearch("");
                    setPendingRefundPendingOnly(false);
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="sticky top-[13px] z-20 mb-3 rounded border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="grid grid-cols-12 gap-4 text-sm text-gray-900">
              <div className="col-span-4 font-medium">Customer / Order</div>
              <div className="col-span-2 font-medium">Amount</div>
              <div className="col-span-2 font-medium">Reason</div>
              <div className="col-span-2 font-medium">Status</div>
              <div className="col-span-2 font-medium">Actions</div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-sm border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
              Loading…
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-sm border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
              No return requests match the current filters.
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {pagedVisible.map((r) => {
                const first = r.items[0];
                const more = Math.max(0, r.items.length - 1);
                return (
                  <div key={r.id} className="overflow-hidden rounded border border-gray-200 bg-white">
                    <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-2.5">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-7 w-7 shrink-0 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 flex items-center justify-center">
                            {initials(r.customer?.name ?? null)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-gray-900">
                              <span className="font-medium truncate max-w-[220px]">{r.customer?.name ?? "—"}</span>
                              <span className="text-gray-300">|</span>
                              <span className="text-gray-600">Order ID:</span>
                              <a
                                href={`/enterprise/orders/returns-refunds/${encodeURIComponent(r.orderId)}`}
                                className="font-medium text-[#2563FF] underline decoration-[#2563FF] underline-offset-4 hover:text-[#1d4ed8]"
                                title={r.orderId}
                              >
                                {compactId(r.orderId, 8)}
                              </a>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(r.orderId);
                                    showToast("Copied Order ID", "success");
                                  } catch {
                                    showToast("Failed to copy", "error");
                                  }
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                aria-label="Copy Order ID"
                                title="Copy Order ID"
                              >
                                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path d="M7 2a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h1v-2H7V4h7v1h2V4a2 2 0 0 0-2-2H7Z" />
                                  <path d="M9 7a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V7Z" />
                                </svg>
                              </button>
                            </div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              Request ID: <span className="font-medium text-gray-700">{shortId(r.id)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{new Date(r.requestedAt).toLocaleString()}</div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 px-4 py-3">
                      <div className="col-span-4">
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                            {first?.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={first.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">
                              {first?.foodName ?? "—"}
                            </p>
                            {more > 0 ? (
                              <p className="mt-1 text-xs leading-normal text-gray-500">+{more} more item(s)</p>
                            ) : null}
                            <p className="mt-1 text-xs text-gray-500">Buyer: {r.customer?.name ?? "—"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-base font-semibold text-[#0070f0] tabular-nums whitespace-nowrap">
                          {formatMoney(r.requestedAmount)}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">{solutionLabel(r.requestedSolution)}</div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-sm font-medium text-gray-900">{reasonLabel(r.reasonCode)}</div>
                        {r.reasonText ? (
                          <div className="mt-1 text-xs text-gray-500 line-clamp-2">{r.reasonText}</div>
                        ) : null}
                      </div>

                      <div className="col-span-2">
                        <div className={statusBadge(r.status)}>{r.status}</div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex flex-col items-start gap-2">
                          <a
                            href={`/enterprise/orders/returns-refunds/${encodeURIComponent(r.orderId)}`}
                            className="text-sm font-medium text-[#0070f0] hover:text-[#0050c0] hover:underline"
                          >
                            View
                          </a>
                          {r.status === "PendingReview" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  openConfirmFromRow(r, "Approved");
                                }}
                                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  openConfirmFromRow(r, "Rejected");
                                }}
                                className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {!loading && visible.length > 0 ? (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={visible.length}
            onPageChange={(n) => setPage(n)}
            onPageSizeChange={(n) => {
              setPageSize(n as any);
              setPage(1);
            }}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
          />
        ) : null}
      </div>

      <ConfirmActionModal
        open={!!confirmCtx}
        title={confirmCtx?.status === "Approved" ? "Approve Return Request" : "Reject Return Request"}
        message={
          confirmCtx?.status === "Approved"
            ? "Are you sure you want to approve this return request?"
            : "Are you sure you want to reject this return request?"
        }
        confirmLabel={confirmCtx?.status === "Approved" ? "Approve" : "Reject"}
        confirmTone={confirmCtx?.status === "Approved" ? "primary" : "danger"}
        confirmLoading={!!saving}
        onClose={() => {
          if (saving) return;
          setConfirmCtx(null);
        }}
        onConfirm={() => void runConfirmed()}
      />
    </div>
  );
}

