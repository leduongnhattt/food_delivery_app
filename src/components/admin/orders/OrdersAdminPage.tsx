"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Eye } from "lucide-react";
import { listAdminOrders } from "@/services/admin-order.service";
import type { AdminOrderListItem } from "@/types/admin-api.types";
import OrderStatusTabs from "./OrderStatusTabs";
import OrderSearch from "./OrderSearch";
import { formatPrice } from "@/lib/utils";

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

export default function OrdersAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") || "all";
  const paymentMethod = searchParams.get("paymentMethod") || "";
  const buyerSearch = searchParams.get("buyerSearch")?.trim() || "";
  const orderId = searchParams.get("orderId")?.trim() || "";
  const enterpriseId = searchParams.get("enterpriseId")?.trim() || "";
  const fromDate = searchParams.get("fromDate") || "";
  const toDate = searchParams.get("toDate") || "";
  const cursor = searchParams.get("cursor") || "";

  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminOrders({
        status: status !== "all" ? status : undefined,
        paymentMethod: paymentMethod || undefined,
        buyerSearch: buyerSearch || undefined,
        orderId: orderId || undefined,
        enterpriseId: enterpriseId || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: 10,
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
    buyerSearch,
    orderId,
    enterpriseId,
    fromDate,
    toDate,
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
      buyerSearch,
      orderId,
      enterpriseId,
      fromDate,
      toDate,
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

  // Lấy payment đầu tiên trong mảng (nếu có)
  function getPrimaryPayment(o: AdminOrderListItem) {
    return o.payments[0] ?? null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
            Orders
          </h1>
          <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
            View and manage all customer orders.
          </p>
        </div>

        {/* Tabs */}
        <OrderStatusTabs current={status} />

        {/* Search & Filters */}
        <OrderSearch
          currentStatus={status}
          initialValues={{
            buyerSearch,
            orderId,
            enterpriseId,
            paymentMethod,
            fromDate,
            toDate,
          }}
        />

        {error && (
          <div className="rounded-lg bg-rose-50 text-rose-800 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto px-4">
            {loading ? (
              <div className="text-center text-slate-500 py-10">Loading…</div>
            ) : (
              <table className="min-w-full text-[13px]">
                <thead>
                  <tr className="bg-[#f9fbfc] text-left border-b border-slate-200">
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Order ID
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Buyer
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Phone
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
                      Status
                    </th>
                    <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Date
                    </th>
                    <th className="py-2 pr-0 text-right w-20 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => {
                    const payment = getPrimaryPayment(o);
                    return (
                      <tr
                        key={o.OrderID}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-2 pr-4 font-mono text-[11px] text-slate-500 max-w-[100px] truncate">
                          {o.OrderID}
                        </td>
                        <td className="py-2 pr-4 text-slate-700 font-medium max-w-[140px] truncate">
                          {o.customer.FullName}
                        </td>
                        <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">
                          {o.customer.PhoneNumber}
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
                        <td className="py-2 pr-0 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/admin/orders/${o.OrderID}`)
                            }
                            className="h-8 px-3 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 inline-flex items-center gap-1 text-slate-700"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <button
                type="button"
                disabled={!cursor}
                onClick={() => goPage(null)}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              >
                ← Back to first
              </button>
              <button
                type="button"
                disabled={!nextCursor}
                onClick={() => goPage(nextCursor)}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
              >
                Next page →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
