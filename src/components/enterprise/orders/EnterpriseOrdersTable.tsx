"use client";

import type { Order } from "@/services/order-management.service";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { orderStatusLabel } from "@/lib/order-status.labels";
import { orderManagementService } from "@/services/order-management.service";
import { buildEnterpriseOrderActions } from "@/components/enterprise/orders/order-actions";

interface Props {
  orders: Order[];
  onDelete?: (orderId: string) => void;
  onConfirm?: (orderId: string) => void;
  onArrangeShipment?: (orderId: string) => void;
  onStartPreparing?: (orderId: string) => void;
  onMarkDelivered?: (orderId: string) => void;
  confirmingOrderId?: string | null;
  actionLoadingOrderId?: string | null;
}

function productTitle(order: Order): string {
  const first = order.orderDetails[0];
  if (!first) return "—";
  return first.dishName;
}

/** Second line under product title: only multi-item hint or real variant — never fake "Default". */
function productSecondaryLine(order: Order): string | null {
  const lines = order.orderDetails;
  if (!lines?.length) return null;
  const first = lines[0];
  const variant = first.variantLabel?.trim();
  if (variant) {
    return `Variation: ${variant}`;
  }
  if (lines.length > 1) {
    return `+${lines.length - 1} more item(s)`;
  }
  return null;
}

function buyerInitials(name: string | undefined): string {
  return (
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "NA"
  );
}

function formatShipBy(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Ship by ${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function EnterpriseOrdersTable({
  orders,
  onDelete,
  onConfirm,
  onArrangeShipment,
  onStartPreparing,
  onMarkDelivered,
  confirmingOrderId,
  actionLoadingOrderId,
}: Props) {
  if (orders.length === 0) {
    return (
      <div className="rounded-sm border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
        No orders match the current filters.
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-[13px] z-20 mb-3 rounded border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="grid grid-cols-12 gap-4 text-sm text-gray-900">
          <div className="col-span-4 font-medium">Product(s)</div>
          <div className="col-span-2 font-medium">Order Total</div>
          <div className="col-span-2 flex items-center gap-1 font-medium">
            Status <span className="text-gray-300">|</span> Countdown
          </div>
          <div className="col-span-2 font-medium">Shipping Channel</div>
          <div className="col-span-2 font-medium">Actions</div>
        </div>
      </div>

      <div className="space-y-3 pb-6">
        {orders.map((order) => {
          const st = order.status.trim();
          const stNorm = st.toLowerCase();
          const pendingDelete =
            stNorm === "pending" && typeof onDelete === "function";
          const showConfirm =
            stNorm === "pending" && typeof onConfirm === "function";
          const confirmBusy = confirmingOrderId === order.id;
          const actionBusy = actionLoadingOrderId === order.id;
          const qty = order.orderDetails.reduce((s, d) => s + d.quantity, 0);
          const firstLine = order.orderDetails[0];
          const secondary = productSecondaryLine(order);
          const shipBy = formatShipBy(order.estimatedDeliveryTime);
          const buyerName = order.customerName || "Buyer";
          const actionModel = buildEnterpriseOrderActions(order);

          return (
            <div
              key={order.id}
              className="overflow-hidden rounded border border-gray-200 bg-white"
            >
              <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600"
                    aria-hidden
                  >
                    {buyerInitials(order.customerName)}
                  </span>
                  <span className="truncate text-sm text-gray-900">{buyerName}</span>
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 text-[#0070f0] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0070f0]/30"
                    aria-label={`Chat with ${buyerName}`}
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4 px-4 py-3">
                <div className="col-span-4">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                      {firstLine?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstLine.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">
                        {productTitle(order)}
                      </p>
                      {secondary ? (
                        <p className="mt-1 text-xs leading-normal text-gray-500">
                          {secondary}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="col-span-2 min-w-0">
                  <div className="inline-grid grid-cols-[auto_auto] items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-xs text-gray-500">x{qty}</span>
                    <span className="text-base font-semibold text-[#0070f0] tabular-nums whitespace-nowrap">
                      {orderManagementService.formatCurrency(order.totalAmount)}
                    </span>
                    <span className="col-start-2 row-start-2 text-xs text-gray-500">
                      {orderStatusLabel(st)}
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-900">
                    {orderStatusLabel(st)}
                  </p>
                  {shipBy ? (
                    <p className="mt-1 text-xs text-gray-600">{shipBy}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-600">
                      {orderManagementService.formatDate(order.createdAt)}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-gray-900">Local Courier</p>
                </div>

                <div className="col-span-2">
                  <div className="flex flex-col items-start gap-2">
                    {actionModel.actions.map((a) => {
                      if (a.key === "confirm" && showConfirm) {
                        return (
                          <button
                            key={a.key}
                            type="button"
                            disabled={confirmBusy}
                            onClick={() => onConfirm?.(order.id)}
                            className={`text-sm font-medium ${
                              confirmBusy
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                            }`}
                          >
                            {confirmBusy ? "Confirming…" : a.label}
                          </button>
                        );
                      }

                      if (a.key === "arrange_shipment") {
                        const disabled = typeof onArrangeShipment !== "function";
                        if (disabled) return null;
                        return (
                          <button
                            key={a.key}
                            type="button"
                            disabled={actionBusy}
                            onClick={() => onArrangeShipment?.(order.id)}
                            className={`text-sm ${
                              actionBusy
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                            }`}
                          >
                            {a.label}
                          </button>
                        );
                      }

                      if (a.key === "start_preparing") {
                        const disabled = a.disabled || typeof onStartPreparing !== "function";
                        if (typeof onStartPreparing !== "function") return null;
                        return (
                          <button
                            key={a.key}
                            type="button"
                            disabled={disabled || actionBusy}
                            onClick={() => onStartPreparing?.(order.id)}
                            title={a.disabledReason || undefined}
                            className={`text-sm ${
                              disabled || actionBusy
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                            }`}
                          >
                            {a.label}
                          </button>
                        );
                      }

                      if (a.key === "start_delivery") {
                        return null;
                      }

                      if (a.key === "mark_delivered") {
                        const disabled = a.disabled || typeof onMarkDelivered !== "function";
                        if (typeof onMarkDelivered !== "function") return null;
                        return (
                          <button
                            key={a.key}
                            type="button"
                            disabled={disabled || actionBusy}
                            onClick={() => onMarkDelivered?.(order.id)}
                            title={a.disabledReason || undefined}
                            className={`text-sm ${
                              disabled || actionBusy
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                            }`}
                          >
                            {a.label}
                          </button>
                        );
                      }

                      return null;
                    })}
                    {stNorm !== "pending" ? (
                      <Link
                        href={`/enterprise/orders/${encodeURIComponent(order.id)}`}
                        className="text-sm text-[#0070f0] hover:text-[#0050c0] hover:underline"
                      >
                        Check Details
                      </Link>
                    ) : null}
                    {pendingDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete?.(order.id)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
