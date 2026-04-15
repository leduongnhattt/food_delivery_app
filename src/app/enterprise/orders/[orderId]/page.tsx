"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import {
  orderManagementService,
  type EnterpriseOrderDetail,
} from "@/services/order-management.service";
import { BuyerPaymentCard } from "@/components/enterprise/orders/BuyerPaymentCard";
import { CancelOrderDialog } from "@/components/enterprise/orders/CancelOrderDialog";
import { FinalAmountCard } from "@/components/enterprise/orders/FinalAmountCard";
import { OrderHistoryCard } from "@/components/enterprise/orders/OrderHistoryCard";
import { OrderInformationCard } from "@/components/enterprise/orders/OrderInformationCard";
import { OrderNoteCard } from "@/components/enterprise/orders/OrderNoteCard";
import { PaymentInformationCard } from "@/components/enterprise/orders/PaymentInformationCard";
import { SellerContactCard } from "@/components/enterprise/orders/SellerContactCard";
import { StatusCard } from "@/components/enterprise/orders/StatusCard";
import {
  ArrangeShipmentModal,
  type DeliveryMethod,
} from "@/components/enterprise/orders/ArrangeShipmentModal";
import { buildEnterpriseOrderActions } from "@/components/enterprise/orders/order-actions";
import {
  buildActivityDisplayItems,
  buildLogisticsTimelineItems,
  buildStatusDisplay,
  clampMoney,
  copyText,
  maskPhone,
} from "@/components/enterprise/orders/order-detail-helpers";

type PatchableStatus =
  | "Confirmed"
  | "Preparing"
  | "ReadyForPickup"
  | "OutForDelivery"
  | "Delivered"
  | "Cancelled";

export default function EnterpriseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const orderId = typeof params?.orderId === "string" ? params.orderId : "";

  const [order, setOrder] = useState<EnterpriseOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [note, setNote] = useState("");
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [incomeDetailsExpanded, setIncomeDetailsExpanded] = useState(true);
  const [buyerPaymentExpanded, setBuyerPaymentExpanded] = useState(true);
  const [arrangeOpen, setArrangeOpen] = useState(false);
  const [arrangeSelected, setArrangeSelected] = useState<DeliveryMethod | null>(null);
  const [arrangeSaving, setArrangeSaving] = useState(false);

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
    load();
  }, [load]);

  const patchStatus = async (status: PatchableStatus) => {
    if (!orderId) return;
    try {
      setActionLoading(true);
      await orderManagementService.updateOrderStatus(orderId, status);
      showToast(
        status === "Cancelled"
          ? "Order cancelled"
          : status === "Confirmed"
            ? "Order confirmed"
            : status === "Preparing"
              ? "Order is now preparing"
              : status === "OutForDelivery"
                ? "Order is now out for delivery"
                : status === "Delivered"
                  ? "Order delivered"
            : "Order status updated",
        "success",
      );
      setShowCancelConfirm(false);
      await load();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Could not update order status";
      showToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

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
          onClick={() => router.push("/enterprise/orders")}
          className="mb-4 inline-flex items-center text-[#0070f0] hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Orders
        </button>
        <p className="text-gray-700">Order not found or you do not have access.</p>
      </div>
    );
  }

  const st = order.status.trim();
  const stLower = st.toLowerCase();
  const actionModel = buildEnterpriseOrderActions(order);

  const subtotal = order.orderDetails.reduce((s, l) => s + l.subTotal, 0);
  const commission = order.commissionAmount ?? 0;
  const netEstimate = order.totalAmount - commission;
  const buyerName = order.customer.fullName || order.customer.username || "—";
  const buyerPhone = maskPhone(order.customer.phoneNumber);
  const noteLimit = 200;

  // Buyer payment breakdown (best effort): explain why total != merchandise subtotal.
  // totalAmount is backend Order.TotalAmount (may include delivery fee, small service fees, etc.).
  const merchandiseSubtotal = clampMoney(subtotal);
  const orderTotal = clampMoney(order.totalAmount);
  const discount = clampMoney(Math.max(0, merchandiseSubtotal - orderTotal));
  const shippingFeePaidByBuyer = clampMoney(
    Math.max(0, orderTotal - merchandiseSubtotal),
  );

  const statusDisplay = buildStatusDisplay(stLower);
  const logisticsTimelineItems = buildLogisticsTimelineItems({
    statusLower: stLower,
    orderDate: order.orderDate,
    deliveredAt: order.deliveredAt,
  });
  const activityDisplayItems = buildActivityDisplayItems({
    statusLower: stLower,
    orderDate: order.orderDate,
    deliveredAt: order.deliveredAt,
  });

  return (
    <div className="w-full bg-gray-50">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          {/* Status card */}
          <StatusCard
            icon={statusDisplay.icon}
            message={statusDisplay.message}
            showCancelOrder={statusDisplay.showCancelOrder}
            showViewPickup={statusDisplay.showViewPickup}
            actionLoading={actionLoading}
            onCancel={() => setShowCancelConfirm(true)}
            onViewPickup={() => showToast("Pickup details is not implemented yet", "info")}
            extraActions={
              <>
                {actionModel.actions.map((a) => {
                  if (a.key === "confirm") {
                    return (
                      <button
                        key={a.key}
                        type="button"
                        disabled={actionLoading}
                        onClick={() => patchStatus("Confirmed")}
                        className={`text-sm font-medium ${
                          actionLoading
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  }
                  if (a.key === "arrange_shipment") {
                    return (
                      <button
                        key={a.key}
                        type="button"
                        disabled={actionLoading}
                        onClick={() => {
                          setArrangeSelected(actionModel.deliveryMethod ?? "SelfDelivery");
                          setArrangeOpen(true);
                        }}
                        className={`text-sm ${
                          actionLoading
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  }
                  if (a.key === "start_preparing") {
                    return (
                      <button
                        key={a.key}
                        type="button"
                        disabled={actionLoading}
                        onClick={() => patchStatus("Preparing")}
                        className={`text-sm ${
                          actionLoading
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  }
                  if (a.key === "start_delivery") {
                    return (
                      <button
                        key={a.key}
                        type="button"
                        disabled={actionLoading || a.disabled}
                        title={a.disabledReason || undefined}
                        onClick={() => patchStatus("OutForDelivery")}
                        className={`text-sm ${
                          actionLoading || a.disabled
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-[#0070f0] hover:text-[#0050c0] hover:underline"
                        }`}
                      >
                        {a.label}
                      </button>
                    );
                  }
                  if (a.key === "mark_delivered") {
                    return (
                      <button
                        key={a.key}
                        type="button"
                        disabled={actionLoading}
                        onClick={() => patchStatus("Delivered")}
                        className={`text-sm ${
                          actionLoading
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
              </>
            }
          />

          {/* Order Information card */}
          <OrderInformationCard
            order={order}
            buyerName={buyerName}
            buyerPhone={buyerPhone}
            timelineExpanded={timelineExpanded}
            logisticsTimelineItems={logisticsTimelineItems}
            onToggleTimeline={() => setTimelineExpanded((v) => !v)}
            onCopyOrderId={async () => {
              const ok = await copyText(order.orderId);
              showToast(ok ? "Copied" : "Could not copy", ok ? "success" : "error");
            }}
          />

          {/* Payment Information card */}
          <PaymentInformationCard
            order={order}
            incomeDetailsExpanded={incomeDetailsExpanded}
            merchandiseSubtotal={merchandiseSubtotal}
            shippingFeePaidByBuyer={shippingFeePaidByBuyer}
            commission={commission}
            netEstimate={netEstimate}
            onToggleIncomeDetails={() => setIncomeDetailsExpanded((v) => !v)}
            onViewTransactionHistory={() =>
              showToast("Transaction history is not implemented yet", "info")
            }
          />

          {/* Final Amount card */}
          <FinalAmountCard totalAmount={order.totalAmount} />

          {/* Buyer Payment card (collapsible) */}
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
          {/* Seller Contact */}
          <SellerContactCard />

          {/* Add a Note */}
          <OrderNoteCard
            note={note}
            noteLimit={noteLimit}
            isNoteEditorOpen={isNoteEditorOpen}
            onOpenEditor={() => setIsNoteEditorOpen(true)}
            onCancel={() => setIsNoteEditorOpen(false)}
            onChangeNote={(next) => setNote(next.slice(0, noteLimit))}
            onSave={() => showToast("Saving notes is not implemented yet", "info")}
          />

          {/* Order History */}
          <OrderHistoryCard items={activityDisplayItems} />
        </div>
      </div>

      <CancelOrderDialog
        open={showCancelConfirm}
        actionLoading={actionLoading}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => patchStatus("Cancelled")}
      />

      <ArrangeShipmentModal
        open={arrangeOpen}
        orderIdLabel={order.orderId ? `#${order.orderId}` : ""}
        selected={arrangeSelected}
        onSelect={setArrangeSelected}
        onClose={() => {
          if (arrangeSaving) return;
          setArrangeOpen(false);
        }}
        onConfirm={async () => {
          if (!arrangeSelected) return;
          try {
            setArrangeSaving(true);
            await orderManagementService.updateDeliveryMethod(orderId, arrangeSelected);
            if (arrangeSelected === "SelfDelivery") {
              await orderManagementService.updateOrderStatus(orderId, "OutForDelivery");
            }
            showToast("Shipment arranged", "success");
            setArrangeOpen(false);
            await load();
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Could not save shipping method";
            showToast(msg, "error");
          } finally {
            setArrangeSaving(false);
          }
        }}
        confirmDisabled={arrangeSaving || !arrangeSelected}
        confirmLabel={arrangeSaving ? "Saving…" : "Confirm"}
      />
    </div>
  );
}
