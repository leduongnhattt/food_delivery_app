"use client";

import { CreditCard, Package, Truck } from "lucide-react";
import { mergeClasses } from "@/lib/utils";

function pillClass() {
  return "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset";
}

function statusColor(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (s === "confirmed") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (s === "preparing") return "bg-violet-50 text-violet-700 ring-violet-200";
  if (s === "outfordelivery" || s === "out_for_delivery")
    return "bg-blue-50 text-blue-700 ring-blue-200";
  if (s === "delivered") return "bg-teal-50 text-teal-700 ring-teal-200";
  if (s === "completed") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (s === "cancelled" || s === "canceled") return "bg-rose-50 text-rose-700 ring-rose-200";
  if (s === "refunded") return "bg-orange-50 text-orange-700 ring-orange-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

export function AdminOrderSummaryCards({
  orderStatus,
  logisticsLabel = "—",
  paymentMethodLabel = "—",
}: {
  orderStatus: string;
  logisticsLabel?: string;
  paymentMethodLabel?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-slate-500">Order Status</div>
            <div className="mt-1">
              <span className={mergeClasses(pillClass(), statusColor(orderStatus))}>
                {orderStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-50 text-sky-700">
            <Truck className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-slate-500">Logistic Status</div>
            <div className="mt-1 text-[12px] font-medium text-slate-700">{logisticsLabel}</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-indigo-50 text-indigo-700">
            <CreditCard className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-slate-500">Payment Method</div>
            <div className="mt-1 text-[12px] font-medium text-slate-700">{paymentMethodLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

