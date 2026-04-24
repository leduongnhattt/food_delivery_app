"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import { orderManagementService, type EnterpriseOrderDetail } from "@/services/order-management.service";
import { EnterpriseReturnsService, type EnterpriseReturnRequestRow } from "@/services/enterprise-returns.service";
import { OrderHistoryCard } from "@/components/enterprise/orders/detail/OrderHistoryCard";
import {
  buildActivityDisplayItems,
  buildStatusDisplay,
} from "@/components/enterprise/orders/detail/order-detail-helpers";
import { CopyToClipboardButton } from "@/components/enterprise/CopyToClipboardButton";
import { initials } from "@/lib/enterprise-orders";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function pickEvidenceImages(meta: unknown): string[] {
  if (!isPlainObject(meta)) return [];
  const evidenceRaw = (meta as any).evidenceImages;
  if (!Array.isArray(evidenceRaw)) return [];
  return evidenceRaw
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function pickMetaString(meta: unknown, key: string): string | null {
  if (!isPlainObject(meta)) return null;
  const raw = (meta as any)[key];
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  return text ? text : null;
}

function pickMetaDateString(meta: unknown, key: string): string | null {
  const isoCandidate = pickMetaString(meta, key);
  if (!isoCandidate) return null;
  const parsedDate = new Date(isoCandidate);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate.toISOString();
}

function maskAddress(addr: string | null | undefined): string {
  const trimmed = (addr || "").trim();
  if (!trimmed) return "—";
  const commaIdx = trimmed.indexOf(",");
  if (commaIdx <= 0) return `******${trimmed.length > 0 ? " " : ""}${trimmed}`.trim();
  return `******${trimmed.slice(commaIdx)}`;
}

export function EnterpriseReturnRefundDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const orderId = typeof params?.orderId === "string" ? params.orderId : "";

  const [order, setOrder] = useState<EnterpriseOrderDetail | null>(null);
  const [rr, setRr] = useState<EnterpriseReturnRequestRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const [orderData, rrList] = await Promise.all([
        orderManagementService.fetchOrderById(orderId),
        EnterpriseReturnsService.list({ status: "All", search: orderId }),
      ]);
      setOrder(orderData);
      const found =
        rrList?.returns?.find((x) => x?.orderId === orderId) ??
        rrList?.returns?.[0] ??
        null;
      setRr(found);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to load order";
      showToast(msg, "error");
      setOrder(null);
      setRr(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#2563FF]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          type="button"
          onClick={() => router.push("/enterprise/orders/returns-refunds")}
          className="inline-flex items-center text-[#0070f0] hover:underline"
        >
          Back to returns / refunds
        </button>
        <p className="mt-3 text-gray-700">Order not found or you do not have access.</p>
      </div>
    );
  }

  const st = order.status.trim();
  const stLower = st.toLowerCase();

  const statusDisplay = buildStatusDisplay(stLower);
  const requestHeader = (() => {
    const status = rr?.status ?? null;
    if (status === "Completed") {
      return {
        title: "Request Refunded",
        message: "You have approved the refund for this order. The refund has been processed.",
        tone: "amber" as const,
      };
    }
    if (status === "Approved") {
      return {
        title: "Request Approved",
        message: "You have approved the refund for this order.",
        tone: "amber" as const,
      };
    }
    if (status === "Rejected") {
      return {
        title: "Request Rejected",
        message: "You have rejected the refund request for this order.",
        tone: "rose" as const,
      };
    }
    return {
      title: "Request Under Review",
      message: "This return/refund request is awaiting your review.",
      tone: "amber" as const,
    };
  })();

  const toneCls =
    requestHeader.tone === "rose"
      ? { banner: "bg-rose-50 border-rose-100 text-rose-900" }
      : { banner: "bg-amber-50 border-amber-100 text-amber-900" };

  const activityDisplayItems = buildActivityDisplayItems({
    statusLower: stLower,
    orderDate: order.orderDate,
    deliveredAt: order.deliveredAt,
  });
  const evidenceImages = pickEvidenceImages(rr?.metadata);
  const logisticsChannel = pickMetaString(rr?.metadata, "logisticsChannel") ?? "—";
  const trackingNumber = pickMetaString(rr?.metadata, "trackingNumber") ?? "—";
  const forwardStatus = pickMetaString(rr?.metadata, "forwardStatus") ?? "—";
  const returnStatus = pickMetaString(rr?.metadata, "returnStatus") ?? "—";
  const transitTitle =
    pickMetaString(rr?.metadata, "logisticsLastEventTitle") ?? "Parcel is in transit to seller";
  const transitAtIso = pickMetaDateString(rr?.metadata, "logisticsLastEventAt");
  const transitAtLabel = transitAtIso
    ? (() => {
        const d = new Date(transitAtIso);
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
      })()
    : "—";

  const buyerName =
    order.customer.fullName || order.customer.username || "—";
  const buyerUsername =
    order.customer.username && order.customer.username !== buyerName ? order.customer.username : null;
  const returnAddressRaw =
    pickMetaString(rr?.metadata, "returnAddress") ||
    pickMetaString(rr?.metadata, "return_address") ||
    order.deliveryAddress ||
    null;
  const returnAddress = maskAddress(returnAddressRaw);

  return (
    <div className="w-full bg-gray-50">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          {/* Top section (matches Return detail reference UI) */}
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-2">
              <statusDisplay.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]" />
              <div className="flex-1">
                <p className="font-medium">{requestHeader.title}</p>
              </div>
            </div>
            <div className={`ml-7 rounded border px-4 py-3 text-sm ${toneCls.banner}`}>
              {requestHeader.message}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]">#</span>
              <h3 className="font-medium">Request Information</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 pl-7 sm:grid-cols-2">
              <div className="text-sm">
                <div className="text-xs font-medium text-gray-500">Request ID</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-medium text-gray-900">{rr?.id ?? "—"}</span>
                  {rr?.id ? <CopyToClipboardButton text={rr.id} label="Request ID" /> : null}
                </div>
              </div>

              <div className="text-sm">
                <div className="text-xs font-medium text-gray-500">Related Order ID</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-medium text-gray-900">{order.orderId}</span>
                  <CopyToClipboardButton text={order.orderId} label="Related Order ID" />
                </div>
              </div>

              <div className="text-sm sm:col-span-2">
                <div className="text-xs font-medium text-gray-500">Request Time</div>
                <div className="mt-1 text-gray-900">
                  {rr?.requestedAt ? orderManagementService.formatDate(rr.requestedAt) : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]">◎</span>
              <h3 className="font-medium">Solution</h3>
            </div>
            <div className="pl-7 text-sm text-gray-700">
              {rr?.requestedSolution === "Replace"
                ? "Replace"
                : rr?.requestedSolution === "StoreCredit"
                  ? "Store credit"
                  : "Refund Only"}
            </div>
          </div>

          {/* Product Information (replaces Payment/Final/Buyer Payment) */}
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path
                      d="M12 3 3.5 7.5 12 12l8.5-4.5L12 3Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.5 7.5V16.5L12 21V12L3.5 7.5Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20.5 7.5V16.5L12 21"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <h3 className="font-medium">Product Information</h3>
              </div>
              <a
                href={`/enterprise/orders/${encodeURIComponent(order.orderId)}`}
                className="text-sm font-medium text-[#0070f0] hover:text-[#0050c0] hover:underline"
              >
                View related order
              </a>
            </div>

            <div className="overflow-hidden rounded border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr className="border-b border-gray-200">
                    <th className="w-[60px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      No.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      Product(s)
                    </th>
                    <th className="w-[140px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Unit price
                    </th>
                    <th className="w-[120px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Quantity
                    </th>
                    <th className="w-[160px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(rr?.items ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        No items found for this request.
                      </td>
                    </tr>
                  ) : (
                    (rr?.items ?? []).map((it, idx) => (
                      <tr key={it.id} className="border-b border-gray-100 last:border-b-0">
                        <td className="px-4 py-4 text-sm text-gray-700">{idx + 1}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded bg-gray-100 border border-gray-200">
                              {it.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-medium text-gray-900">{it.foodName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-gray-900">
                          {orderManagementService.formatCurrency(
                            it.quantity ? it.lineAmount / it.quantity : it.lineAmount,
                          )}
                        </td>
                        <td className="px-4 py-4 text-right tabular-nums text-gray-900">{it.quantity}</td>
                        <td className="px-4 py-4 text-right tabular-nums text-gray-900">
                          {orderManagementService.formatCurrency(it.lineAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center justify-end gap-2">
                  <div className="text-sm font-medium text-gray-700">Refund amount:</div>
                  <div className="text-sm font-semibold text-[#2563FF] tabular-nums">
                    {orderManagementService.formatCurrency(rr?.requestedAmount ?? 0)}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Paid by buyer:{" "}
                  <span className="font-medium text-gray-700 tabular-nums">
                    {orderManagementService.formatCurrency(order.totalAmount)}
                  </span>
                  {typeof rr?.requestedAmount === "number" ? (
                    <>
                      {" "}
                      • Fees/shipping:{" "}
                      <span className="font-medium text-gray-700 tabular-nums">
                        {orderManagementService.formatCurrency(
                          Math.max(0, (order.totalAmount ?? 0) - (rr.requestedAmount ?? 0)),
                        )}
                      </span>
                    </>
                  ) : null}
                </div>
                <div className="text-[11px] text-gray-400">
                  Refund amount typically covers returned items only; fees/shipping may be non-refundable.
                </div>
              </div>
            </div>
          </div>

          {/* Reason from Buyer (below Product Information) */}
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path
                    d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 15h10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <h3 className="font-medium">Reason from Buyer</h3>
            </div>
            <div className="ml-7 rounded bg-blue-50 px-5 py-4">
              <div className="text-sm font-semibold text-gray-900">
                {rr?.reasonCode ? rr.reasonCode.replaceAll("_", " ") : "—"}
              </div>
              {rr?.reasonText ? (
                <div className="mt-2 text-sm text-gray-700">{rr.reasonText}</div>
              ) : null}

              {evidenceImages.length > 0 ? (
                <div className="mt-4">
                  <div className="text-xs font-medium text-gray-600">Evidence Images</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {evidenceImages.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="h-14 w-14 overflow-hidden rounded border border-gray-200 bg-white"
                        title="Open image"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Logistic Information (below Reason from Buyer) */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
              <span className="text-[#2563FF]">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path
                    d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M2.6 12h18.8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 2c2.8 2.6 4.4 6.1 4.4 10S14.8 19.4 12 22c-2.8-2.6-4.4-6.1-4.4-10S9.2 4.6 12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3 className="text-sm font-semibold text-gray-900">Logistic Information</h3>
            </div>

            <div className="px-6 py-4 text-sm text-gray-700">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Logistics Channel:</span>
                  <span className="font-medium text-gray-900">{logisticsChannel}</span>
                </div>
                <span className="text-gray-300">|</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Tracking Number:</span>
                  <span className="font-medium text-gray-900">{trackingNumber}</span>
                  {trackingNumber !== "—" ? <CopyToClipboardButton text={trackingNumber} label="Tracking Number" /> : null}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Forward Status:</span>
                  {forwardStatus !== "—" ? (
                    <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                      {forwardStatus}
                    </span>
                  ) : (
                    <span className="text-gray-900">—</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Return Status:</span>
                  <span className="text-gray-900">{returnStatus}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-[#2563FF]" />
                  <div>
                    <div className="text-sm font-medium text-[#2563FF]">{transitTitle}</div>
                    <div className="text-xs text-gray-500">{transitAtLabel}</div>
                  </div>
                </div>
                <button type="button" className="text-sm font-medium text-[#2563FF] hover:underline">
                  Expand
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="p-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563FF] text-sm font-semibold text-white">
                  {initials(buyerName)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-gray-900">{buyerName}</div>
                  {buyerUsername ? (
                    <div className="text-xs text-gray-500">{buyerUsername}</div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Chat is not implemented yet", "info")}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[#2563FF] px-4 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                >
                  <span className="text-white">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path
                        d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.2A8 8 0 1 1 21 12Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  Chat Now
                </button>
              </div>

              <div className="mt-5 border-t border-gray-200 pt-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-gray-500">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path
                        d="M12 22s7-5.2 7-12A7 7 0 1 0 5 10c0 6.8 7 12 7 12Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">Return Address</div>
                    <div className="mt-1 text-sm text-gray-700">{returnAddress}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <OrderHistoryCard items={activityDisplayItems} />

          <div className="rounded-xl border border-[#cfe2ff] bg-[#eff6ff] p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[#3b82f6]">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path
                    d="M12 22a10 10 0 1 0-10-10 10 10 0 0 0 10 10Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <path
                    d="M12 8v5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 16h.01"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">Need help?</div>
                <div className="mt-1 text-sm text-gray-700">
                  If you're unsure about the return reason or evidence, you can contact{" "}
                  <span className="font-medium">Hanala Food</span> Support or chat directly with the buyer.
                </div>
                <button
                  type="button"
                  className="mt-3 text-sm font-semibold text-[#2563FF] hover:underline"
                  onClick={() => showToast("Return policies are not implemented yet", "info")}
                >
                  Learn more about return policies
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

