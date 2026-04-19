"use client";

import type { Order } from "@/services/order-management.service";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { orderStatusLabel } from "@/lib/order-status.labels";
import { orderManagementService } from "@/services/order-management.service";
import { buildEnterpriseOrderActions } from "@/components/enterprise/orders/detail/order-actions";
import { hasReturnRefund } from "@/lib/enterprise-order-buckets";

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

function pickMetaString(meta: unknown, key: string): string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const rawValue = (meta as any)[key];
  if (typeof rawValue !== "string") return null;
  const trimmed = rawValue.trim();
  return trimmed ? trimmed : null;
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
          const statusRaw = order.status.trim();
          const statusNorm = statusRaw.toLowerCase();
          const isReturnRefund = hasReturnRefund(order);
          const metadataObj = (order.metadata && typeof order.metadata === "object" && !Array.isArray(order.metadata))
            ? (order.metadata as any)
            : null;
          const refundPending = metadataObj?.refundPending === true;
          const canDeletePending = statusNorm === "pending" && typeof onDelete === "function";
          const canConfirmPending = statusNorm === "pending" && typeof onConfirm === "function";
          const isConfirmingThisOrder = confirmingOrderId === order.id;
          const isActionLoadingThisOrder = actionLoadingOrderId === order.id;
          const totalQuantity = order.orderDetails.reduce((sum, line) => sum + line.quantity, 0);
          const firstOrderLine = order.orderDetails[0];
          const secondaryLine = productSecondaryLine(order);
          const shipByLabel =
            statusNorm === "cancelled" || statusNorm === "confirmed"
              ? null
              : formatShipBy(order.estimatedDeliveryTime);
          const cancelledAt = pickMetaString(order.metadata, "cancelledAt");
          const confirmedAt = pickMetaString(order.metadata, "confirmedAt");
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
                      {firstOrderLine?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={firstOrderLine.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">
                        {productTitle(order)}
                      </p>
                      {secondaryLine ? (
                        <p className="mt-1 text-xs leading-normal text-gray-500">
                          {secondaryLine}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="col-span-2 min-w-0">
                  <div className="inline-grid grid-cols-[auto_auto] items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-xs text-gray-500">x{totalQuantity}</span>
                    <span className="text-base font-semibold text-[#0070f0] tabular-nums whitespace-nowrap">
                      {orderManagementService.formatCurrency(order.totalAmount)}
                    </span>
                    <span className="col-start-2 row-start-2 text-xs text-gray-500">
                      {orderStatusLabel(statusRaw)}
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {orderStatusLabel(statusRaw)}
                    </p>
                    {isReturnRefund ? (
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                        Return / Refund
                      </span>
                    ) : null}
                    {refundPending ? (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                        Refund pending
                      </span>
                    ) : null}
                  </div>
                  {shipByLabel ? (
                    <p className="mt-1 text-xs text-gray-600">{shipByLabel}</p>
                  ) : statusNorm === "cancelled" ? (
                    <p className="mt-1 text-xs text-gray-600">
                      Cancelled at{" "}
                      {orderManagementService.formatDate(cancelledAt || order.createdAt)}
                    </p>
                  ) : statusNorm === "confirmed" ? (
                    <p className="mt-1 text-xs text-gray-600">
                      Confirmed at{" "}
                      {orderManagementService.formatDate(confirmedAt || order.createdAt)}
                    </p>
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
                    {actionModel.actions.map((action) => {
                      if (action.key === "confirm" && canConfirmPending) {
                        return (
                          <button
                            key={action.key}
                            type="button"
                            disabled={isConfirmingThisOrder}
                            onClick={() => onConfirm?.(order.id)}
                            className={`text-sm font-medium ${
                              isConfirmingThisOrder
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                            }`}
                          >
                            {isConfirmingThisOrder ? "Confirming…" : action.label}
                          </button>
                        );
                      }

                      if (action.key === "arrange_shipment") {
                        const disabled = typeof onArrangeShipment !== "function";
                        if (disabled) return null;
                        return (
                          <button
                            key={action.key}
                            type="button"
                            disabled={isActionLoadingThisOrder}
                            onClick={() => onArrangeShipment?.(order.id)}
                            className={`text-sm ${
                              isActionLoadingThisOrder
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                            }`}
                          >
                            {action.label}
                          </button>
                        );
                      }

                      if (action.key === "start_preparing") {
                        const disabled = action.disabled || typeof onStartPreparing !== "function";
                        if (typeof onStartPreparing !== "function") return null;
                        return (
                          <button
                            key={action.key}
                            type="button"
                            disabled={disabled || isActionLoadingThisOrder}
                            onClick={() => onStartPreparing?.(order.id)}
                            title={action.disabledReason || undefined}
                            className={`text-sm ${
                              disabled || isActionLoadingThisOrder
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                            }`}
                          >
                            {action.label}
                          </button>
                        );
                      }

                      if (action.key === "start_delivery") {
                        return null;
                      }

                      if (action.key === "mark_delivered") {
                        const disabled = action.disabled || typeof onMarkDelivered !== "function";
                        if (typeof onMarkDelivered !== "function") return null;
                        return (
                          <button
                            key={action.key}
                            type="button"
                            disabled={disabled || isActionLoadingThisOrder}
                            onClick={() => onMarkDelivered?.(order.id)}
                            title={action.disabledReason || undefined}
                            className={`text-sm ${
                              disabled || isActionLoadingThisOrder
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                            }`}
                          >
                            {action.label}
                          </button>
                        );
                      }

                      return null;
                    })}
                    {statusNorm !== "pending" ? (
                      <Link
                        href={
                          statusNorm === "cancelled"
                            ? `/enterprise/orders/order-cancellation/${encodeURIComponent(order.id)}`
                            : isReturnRefund
                              ? `/enterprise/orders/returns-refunds/${encodeURIComponent(order.id)}`
                            : `/enterprise/orders/${encodeURIComponent(order.id)}`
                        }
                        className="text-sm text-[#0070f0] hover:text-[#0050c0] hover:underline"
                      >
                        Check Details
                      </Link>
                    ) : null}
                    {canDeletePending && (
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

