"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import { orderManagementService, type EnterpriseOrderDetail } from "@/services/order-management.service";
import { BuyerPaymentCard } from "@/components/enterprise/orders/detail/BuyerPaymentCard";
import { FinalAmountCard } from "@/components/enterprise/orders/detail/FinalAmountCard";
import { OrderHistoryCard } from "@/components/enterprise/orders/detail/OrderHistoryCard";
import { OrderInformationCardCancel } from "@/components/enterprise/orders/cancellation/OrderInformationCardCancel";
import { OrderNoteCard } from "@/components/enterprise/orders/detail/OrderNoteCard";
import { PaymentInformationCard } from "@/components/enterprise/orders/detail/PaymentInformationCard";
import {
  buildActivityDisplayItems,
  buildStatusDisplay,
  clampMoney,
  copyText,
  maskPhone,
} from "@/components/enterprise/orders/detail/order-detail-helpers";
import { cancelReasonLabel, initials, pickMetaString } from "@/lib/enterprise-orders";

export function EnterpriseOrderCancellationDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const orderId = typeof params?.orderId === "string" ? params.orderId : "";

  const [order, setOrder] = useState<EnterpriseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [incomeDetailsExpanded, setIncomeDetailsExpanded] = useState(true);
  const [buyerPaymentExpanded, setBuyerPaymentExpanded] = useState(true);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data = await orderManagementService.fetchOrderById(orderId);
      setOrder(data);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to load order";
      showToast(msg, "error");
      setOrder(null);
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
          onClick={() => router.push("/enterprise/orders/order-cancellation")}
          className="inline-flex items-center text-[#0070f0] hover:underline"
        >
          Back to cancellations
        </button>
        <p className="mt-3 text-gray-700">Order not found or you do not have access.</p>
      </div>
    );
  }

  const st = order.status.trim();
  const stLower = st.toLowerCase();

  const subtotal = order.orderDetails.reduce((s, l) => s + l.subTotal, 0);
  const commission = order.commissionAmount ?? 0;
  const netEstimate = order.totalAmount - commission;
  const buyerName = order.customer.fullName || order.customer.username || "—";
  const buyerUsername = order.customer.username || null;
  const buyerPhone = maskPhone(order.customer.phoneNumber);
  const noteLimit = 200;

  const merchandiseSubtotal = clampMoney(subtotal);
  const orderTotal = clampMoney(order.totalAmount);
  const discount = clampMoney(Math.max(0, merchandiseSubtotal - orderTotal));
  const shippingFeePaidByBuyer = clampMoney(Math.max(0, orderTotal - merchandiseSubtotal));

  const statusDisplay = buildStatusDisplay(stLower);
  const cancelReasonText =
    pickMetaString(order.metadata, "cancelReasonText") ||
    pickMetaString(order.metadata, "cancelReasonNote") ||
    cancelReasonLabel(pickMetaString(order.metadata, "cancelReason"));
  const cancelledAt = pickMetaString(order.metadata, "cancelledAt") || order.orderDate;
  const shippingTimelineItems = [
    { title: "Cancelled", formattedDate: orderManagementService.formatDate(cancelledAt) },
  ];
  const activityDisplayItems = [
    { title: "Order Cancelled", formattedDate: orderManagementService.formatDate(cancelledAt) },
    ...buildActivityDisplayItems({
      statusLower: "pending",
      orderDate: order.orderDate,
      deliveredAt: null,
    }),
  ];

  return (
    <div className="w-full bg-gray-50 text-[13px]">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-red-200 bg-white p-6">
            <div className="flex items-start gap-2">
              <statusDisplay.icon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{st === "Cancelled" ? "Cancelled" : st}</p>
                  <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 !text-xs font-medium text-red-700">
                    Cancelled
                  </span>
                </div>
              </div>
            </div>
            <div className="ml-7 rounded bg-blue-50 px-4 py-3 text-sm text-gray-700">
              <span className="font-medium">Cancel Reason:</span> {cancelReasonText}
            </div>
          </div>

          <OrderInformationCardCancel
            order={order}
            buyerName={buyerName}
            buyerPhone={buyerPhone}
            shippingTimelineItems={shippingTimelineItems}
            onCopyOrderId={async () => {
              const ok = await copyText(order.orderId);
              showToast(ok ? "Copied" : "Could not copy", ok ? "success" : "error");
            }}
          />

          <PaymentInformationCard
            order={order}
            incomeDetailsExpanded={incomeDetailsExpanded}
            merchandiseSubtotal={merchandiseSubtotal}
            shippingFeePaidByBuyer={shippingFeePaidByBuyer}
            commission={commission}
            netEstimate={netEstimate}
            onToggleIncomeDetails={() => setIncomeDetailsExpanded((v) => !v)}
            onViewTransactionHistory={() => showToast("Transaction history is not implemented yet", "info")}
          />

          <FinalAmountCard totalAmount={order.totalAmount} />

          <BuyerPaymentCard
            buyerPaymentExpanded={buyerPaymentExpanded}
            onToggle={() => setBuyerPaymentExpanded((v) => !v)}
            merchandiseSubtotal={merchandiseSubtotal}
            shippingFeePaidByBuyer={shippingFeePaidByBuyer}
            discount={discount}
            orderTotal={orderTotal}
          />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2563FF] text-sm font-semibold text-white">
                {initials(buyerName)}
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium text-gray-900">{buyerName}</div>
                {buyerUsername ? <div className="!text-xs text-gray-500">{buyerUsername}</div> : null}
              </div>
              <button
                type="button"
                onClick={() => showToast("Chat is not implemented yet", "info")}
                className="inline-flex h-9 w-full items-center justify-center rounded bg-[#2563FF] px-4 text-sm font-medium text-white hover:bg-[#1d4ed8]"
              >
                Chat Now
              </button>
            </div>
          </div>

          <OrderNoteCard
            note={note}
            noteLimit={noteLimit}
            isNoteEditorOpen={isNoteEditorOpen}
            onOpenEditor={() => setIsNoteEditorOpen(true)}
            onCancel={() => setIsNoteEditorOpen(false)}
            onChangeNote={(next) => setNote(next.slice(0, noteLimit))}
            onSave={() => showToast("Saving notes is not implemented yet", "info")}
            compact
          />

          <OrderHistoryCard items={activityDisplayItems} compact />
        </div>
      </div>
    </div>
  );
}

