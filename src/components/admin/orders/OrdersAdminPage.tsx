"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Eye, MoreVertical } from "lucide-react";
import { deleteAdminOrder, listAdminOrders } from "@/services/admin-order.service";
import type { AdminOrderListItem } from "@/types/admin-api.types";
import OrderStatusSelect from "./OrderStatusSelect";
import OrderSearch from "./OrderSearch";
import { formatPrice } from "@/lib/utils";
import { getActionMenuPosition } from "@/components/admin/enterprises/list/utils";
import { Pagination } from "@/components/ui/pagination";

const statusColorMap: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  Preparing: "bg-violet-50 text-violet-700 border-violet-200",
  ReadyForPickup: "bg-indigo-50 text-indigo-700 border-indigo-200",
  OutForDelivery: "bg-blue-50 text-blue-700 border-blue-200",
  Delivered: "bg-teal-50 text-teal-700 border-teal-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  Refunded: "bg-orange-50 text-orange-700 border-orange-200",
};

const paymentStatusColorMap: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Failed: "bg-rose-50 text-rose-700 border-rose-200",
};

const paymentMethodLabel: Record<string, string> = {
  Cash: "Cash",
  CreditCard: "Credit Card",
  MoMo: "MoMo",
  VNPay: "VNPay",
  BankTransfer: "Bank Transfer",
};

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

export default function OrdersAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") || "all";
  const paymentMethod = searchParams.get("paymentMethod") || "";
  const paymentStatus = searchParams.get("paymentStatus") || "";
  const q = searchParams.get("q")?.trim() || "";
  const qMode = searchParams.get("qMode") || "buyer";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const cursor = searchParams.get("cursor") || "";
  const limitParam = Number(searchParams.get("limit") || "") || 12;
  const limit = (PAGE_SIZE_OPTIONS.includes(limitParam as any)
    ? (limitParam as (typeof PAGE_SIZE_OPTIONS)[number])
    : 12) as (typeof PAGE_SIZE_OPTIONS)[number];

  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<{ orderId: string; left: number; top: number } | null>(null);
  const actionMenuElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node | null;
      const clickedMenu = !!(actionMenuElRef.current && target && actionMenuElRef.current.contains(target));
      const clickedTrigger = !!(target && target instanceof Element && target.closest("[data-action-menu-trigger='true']"));
      if (!clickedMenu && !clickedTrigger) setActionMenu(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const cursorStackKey = useMemo(() => {
    return [
      "adminOrdersCursorStack",
      status,
      paymentMethod,
      paymentStatus,
      q,
      qMode,
      fromDate,
      toDate,
      String(limit),
    ].join("|");
  }, [status, paymentMethod, paymentStatus, q, qMode, fromDate, toDate, limit]);

  const cursorStack = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(cursorStackKey);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  }, [cursorStackKey]);

  function clearCursorStack() {
    writeCursorStack([]);
  }

  const pageIndex = cursorStack.length + 1;
  const totalPagesHint = nextCursor ? pageIndex + 1 : pageIndex;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isEmail = q.includes("@");
      const effectiveQ = isEmail ? "" : q;
      const buyerSearch = qMode === "orderId" ? "" : effectiveQ;
      const orderId = qMode === "orderId" ? effectiveQ : "";

      const res = await listAdminOrders({
        status: status !== "all" ? status : undefined,
        paymentMethod: paymentMethod || undefined,
        paymentStatus: paymentStatus || undefined,
        buyerSearch: buyerSearch || undefined,
        orderId: orderId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit,
        cursor: cursor || undefined,
      });
      setOrders(res.items);
      setNextCursor(res.nextCursor ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [
    status,
    paymentMethod,
    paymentStatus,
    q,
    qMode,
    fromDate,
    toDate,
    limit,
    cursor,
  ]);

  useEffect(() => {
    void load();
  }, [load]);

  function buildQuery(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      status,
      paymentMethod,
      paymentStatus,
      q,
      qMode,
      fromDate,
      toDate,
      limit: String(limit),
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "all") p.set(k, v);
    }
    return p.toString();
  }

  function goPage(nextCursorVal: string | null) {
    const qs = buildQuery({ cursor: nextCursorVal ?? undefined });
    router.push(qs ? `/admin/orders?${qs}` : "/admin/orders");
  }

  function writeCursorStack(next: string[]) {
    try {
      sessionStorage.setItem(cursorStackKey, JSON.stringify(next));
    } catch {}
  }

  function goNext() {
    if (!nextCursor) return;
    const nextStack = [...cursorStack, cursor || ""];
    writeCursorStack(nextStack);
    goPage(nextCursor);
  }

  function goPrev() {
    if (cursorStack.length === 0) {
      goPage(null);
      return;
    }
    const nextStack = cursorStack.slice(0, -1);
    writeCursorStack(nextStack);
    const prevCursor = nextStack.length ? nextStack[nextStack.length - 1] : "";
    goPage(prevCursor || null);
  }

  function changeLimit(nextLimit: (typeof PAGE_SIZE_OPTIONS)[number]) {
    const qs = buildQuery({
      limit: String(nextLimit),
      cursor: undefined,
    });
    writeCursorStack([]);
    router.push(qs ? `/admin/orders?${qs}` : "/admin/orders");
  }

  function getPrimaryPayment(o: AdminOrderListItem) {
    return o.payments[0] ?? null;
  }

  function csvEscape(v: unknown): string {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function exportOrderRow(o: AdminOrderListItem) {
    const p = o.payments[0];
    const header = [
      "OrderID",
      "Buyer",
      "Seller",
      "Total",
      "PaymentMethod",
      "PayStatus",
      "OrderStatus",
      "OrderDate",
    ];
    const line = [
      csvEscape(o.OrderID),
      csvEscape(o.customer?.FullName ?? ""),
      csvEscape((o.sellers ?? []).join(", ")),
      csvEscape(o.TotalAmount),
      csvEscape(p?.PaymentMethod ?? ""),
      csvEscape(p?.PaymentStatus ?? ""),
      csvEscape(o.Status),
      csvEscape(o.OrderDate),
    ].join(",");
    const blob = new Blob([header.join(",") + "\n" + line], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-${o.OrderID}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteOrder(orderId: string) {
    if (deletingOrderId) return;
    const ok = window.confirm("Delete this order? This cannot be undone.");
    if (!ok) return;
    setDeletingOrderId(orderId);
    setActionMenu(null);
    try {
      await deleteAdminOrder(orderId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete order");
    } finally {
      setDeletingOrderId(null);
    }
  }

  async function exportHistory() {
    if (exporting) return;
    setExporting(true);
    setError(null);
    try {
      const isEmail = q.includes("@");
      const effectiveQ = isEmail ? "" : q;
      const buyerSearch = qMode === "orderId" ? "" : effectiveQ;
      const orderId = qMode === "orderId" ? effectiveQ : "";

      const take = 200;
      const maxRows = 5000;
      const all: AdminOrderListItem[] = [];
      let cur: string | undefined = undefined;

      while (all.length < maxRows) {
        const res = await listAdminOrders({
          status: status !== "all" ? status : undefined,
          paymentMethod: paymentMethod || undefined,
          paymentStatus: paymentStatus || undefined,
          buyerSearch: buyerSearch || undefined,
          orderId: orderId || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          limit: take,
          cursor: cur,
        });

        all.push(...res.items);
        if (!res.nextCursor) break;
        cur = res.nextCursor;
      }

      const rows = all.slice(0, maxRows);
      const header = [
        "OrderID",
        "Buyer",
        "Seller",
        "Total",
        "PaymentMethod",
        "PayStatus",
        "OrderStatus",
        "OrderDate",
      ];

      const lines = [
        header.join(","),
        ...rows.map((o) => {
          const p = o.payments[0];
          return [
            csvEscape(o.OrderID),
            csvEscape(o.customer?.FullName ?? ""),
            csvEscape((o.sellers ?? []).join(", ")),
            csvEscape(o.TotalAmount),
            csvEscape(p?.PaymentMethod ?? ""),
            csvEscape(p?.PaymentStatus ?? ""),
            csvEscape(o.Status),
            csvEscape(o.OrderDate),
          ].join(",");
        }),
      ].join("\n");

      const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `orders-export-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to export orders");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
              Orders
            </h1>
            <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
              View and manage all customer orders.
            </p>
          </div>

          <button
            type="button"
            disabled={exporting}
            onClick={exportHistory}
            className="inline-flex h-8 min-h-8 w-fit items-center gap-2 rounded border border-[#2563FF] bg-[#2563FF] px-3 py-0 text-[13px] font-medium text-white hover:bg-[#1E4FE6] disabled:opacity-60 transition-colors"
          >
            {exporting ? "Exporting…" : "Export"}
          </button>
        </div>

        {/* Search & Filters */}
        <OrderSearch
          currentStatus={status}
          initialValues={{
            q,
            paymentMethod,
            paymentStatus,
            fromDate,
            toDate,
          }}
          statusControl={<OrderStatusSelect current={status} onStatusChange={clearCursorStack} />}
        />

        {error && (
          <div className="rounded-lg bg-rose-50 text-rose-800 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {actionMenu && (
          <div
            ref={actionMenuElRef}
            style={{ left: actionMenu.left, top: actionMenu.top }}
            className="fixed z-[60] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
            onClick={(ev) => ev.stopPropagation()}
          >
            <button
              type="button"
              className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] hover:bg-slate-50 text-left"
              onClick={() => {
                const row = orders.find((x) => x.OrderID === actionMenu.orderId);
                if (row) exportOrderRow(row);
                setActionMenu(null);
              }}
            >
              Export row
            </button>
            <button
              type="button"
              disabled={deletingOrderId === actionMenu.orderId}
              className="w-full flex items-center px-3 py-2 text-[12px] leading-4 font-normal text-rose-600 hover:bg-slate-50 disabled:opacity-60 text-left"
              onClick={() => handleDeleteOrder(actionMenu.orderId)}
            >
              Delete
            </button>
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center text-slate-500 py-10">Loading…</div>
            ) : (
              <table className="min-w-full text-[13px]">
                <thead>
                  <tr className="bg-[#f9fbfc] text-left border-b border-slate-200">
                    <th className="py-2 pr-4 pl-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Order ID
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Buyer
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Seller
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Total
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Payment
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Pay Status
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Order Status
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Date
                    </th>
                    <th className="py-2 pr-4 text-right w-20 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => {
                    const payment = getPrimaryPayment(o);
                    const shortOrderId = o.OrderID.length > 5 ? o.OrderID.slice(-5) : o.OrderID;
                    return (
                      <tr
                        key={o.OrderID}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-2 pr-4 pl-4 font-mono text-[11px] max-w-[100px] truncate">
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/orders/${o.OrderID}`)}
                            title={o.OrderID}
                            className="text-sky-600 hover:text-sky-700 hover:underline underline-offset-2"
                          >
                            {shortOrderId}
                          </button>
                        </td>
                        <td className="py-2 pr-4 text-slate-700 font-medium max-w-[140px] truncate">
                          {o.customer.FullName}
                        </td>
                        <td className="py-2 pr-4 text-slate-700 font-medium max-w-[160px] truncate">
                          {(o.sellers ?? []).join(", ") || "—"}
                        </td>
                        <td className="py-2 pr-4 text-slate-700 font-medium whitespace-nowrap">
                          {formatPrice(o.TotalAmount)}
                        </td>
                        <td className="py-2 pr-4 text-slate-600">
                          {payment
                            ? (paymentMethodLabel[payment.PaymentMethod] ??
                              payment.PaymentMethod)
                            : "—"}
                        </td>
                        <td className="py-2 pr-4">
                          {payment ? (
                            <span
                              className={`text-xs px-2 py-1 rounded border ${
                                paymentStatusColorMap[payment.PaymentStatus] ??
                                "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {payment.PaymentStatus}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`text-xs px-2 py-1 rounded border ${
                              statusColorMap[o.Status] ??
                              "bg-slate-50 text-slate-600 border-slate-200"
                            }`}
                          >
                            {o.Status}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">
                          {formatDate(o.OrderDate).split(",")[0]}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <div className="flex items-center justify-end">
                            <Link
                              href={`/admin/orders/${encodeURIComponent(o.OrderID)}`}
                              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs leading-4 font-medium text-[#2563FF] hover:bg-blue-50"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Link>

                            <div className="relative inline-flex justify-end">
                              <button
                                type="button"
                                disabled={deletingOrderId === o.OrderID}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  const btn = ev.currentTarget;
                                  const { left, top } = getActionMenuPosition(btn);
                                  setActionMenu((cur) =>
                                    cur?.orderId === o.OrderID ? null : { orderId: o.OrderID, left, top },
                                  );
                                }}
                                className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-60"
                                aria-label="Actions"
                                data-action-menu-trigger="true"
                              >
                                <MoreVertical className="w-4 h-4 text-slate-700" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {!loading && orders.length === 0 && (
              <div className="text-center text-slate-500 py-10">
                No orders found
              </div>
            )}
          </div>

          {/* Pagination */}
          {!loading && (orders.length > 0 || cursor) && (
            <Pagination
              variant="cursor"
              canPrev={!!cursor || cursorStack.length > 0}
              canNext={!!nextCursor}
              pageLabel={`${pageIndex} / ${totalPagesHint}`}
              onPrev={goPrev}
              onNext={goNext}
              pageSize={limit}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageSizeChange={(n) => changeLimit(n as any)}
              leftSlot={
                <div className="text-[11px] font-normal leading-4 text-slate-600">
                  Showing <span className="text-slate-900">{orders.length}</span> orders
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
