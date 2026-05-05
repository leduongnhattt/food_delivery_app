"use client";

import type { AdminOrderDetail } from "@/types/admin-api.types";
import { useMemo, useState } from "react";
import { AdminOrderDetailsHeader } from "@/components/admin/orders/detail/AdminOrderDetailsHeader";
import { AdminOrderSummaryCards } from "@/components/admin/orders/detail/AdminOrderSummaryCards";
import {
  AdminOrderDetailsTabs,
  type AdminOrderDetailsTab,
} from "@/components/admin/orders/detail/AdminOrderDetailsTabs";
import { AdminOrderInfoCards } from "@/components/admin/orders/detail/AdminOrderInfoCards";
import { AdminOrderProductListTable } from "@/components/admin/orders/detail/AdminOrderProductListTable";
import { AdminOrderProcessingTimelineCard } from "@/components/admin/orders/detail/AdminOrderProcessingTimelineCard";
import {
  AdminOrderHistoryCard,
  type AdminOrderHistoryRow,
} from "@/components/admin/orders/detail/AdminOrderHistoryCard";
import { AdminOrderLogisticsInfoCard } from "@/components/admin/orders/detail/AdminOrderLogisticsInfoCard";
import { AdminOrderPaymentFeesCard } from "@/components/admin/orders/detail/AdminOrderPaymentFeesCard";
import { adminPaymentSummaryLine, primaryPaymentRow } from "@/lib/admin-order-payment";

export default function OrderDetailPage({
  order,
}: {
  order: AdminOrderDetail;
}) {
  const [tab, setTab] = useState<AdminOrderDetailsTab>("order_info");

  const paymentSummaryLabel = useMemo(() => {
    return adminPaymentSummaryLine(primaryPaymentRow(order.payments));
  }, [order.payments]);

  const timelineSteps = useMemo(() => {
    const createdAt = order.OrderDate;
    return [
      { id: "created", label: "Order Create", actualAt: createdAt },
      { id: "paid", label: "Paid/COD Confirmed", actualAt: null },
      { id: "shipped", label: "Shipped Out", actualAt: null },
      { id: "delivered", label: "Delivered", actualAt: null },
      { id: "buyer", label: "Buyer Confirmed", actualAt: null },
      { id: "escrow", label: "Escrow Release Created", actualAt: null },
    ] as const;
  }, [order.OrderDate]);

  const historyRows = useMemo<AdminOrderHistoryRow[]>(() => {
    const createdAt = order.OrderDate;
    return [
      {
        id: "created",
        kind: "order",
        at: createdAt,
        statusLabel: "Created",
        operatorLabel: "System",
        remark: "Order created",
      },
    ];
  }, [order.OrderDate]);

  return (
    <div className="space-y-4">
      <AdminOrderDetailsHeader orderId={order.OrderID} />

      <AdminOrderSummaryCards
        orderStatus={order.Status}
        logisticsLabel="Logistics Ready"
        paymentMethodLabel={paymentSummaryLabel}
      />

      <AdminOrderDetailsTabs value={tab} onChange={setTab} />

      {tab === "order_info" ? (
        <div className="space-y-3">
          <AdminOrderInfoCards order={order} />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <AdminOrderLogisticsInfoCard order={order} />
            <AdminOrderPaymentFeesCard order={order} />
          </div>
          <AdminOrderProductListTable order={order} />
        </div>
      ) : tab === "status_timeline" ? (
        <div className="space-y-3">
          <AdminOrderProcessingTimelineCard steps={[...timelineSteps]} />
          <AdminOrderHistoryCard rows={historyRows} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-[12px] text-slate-500">
            Logistics info UI will be wired later.
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-[12px] text-slate-500">
            Payment & fees UI will be wired later.
          </div>
        </div>
      )}
    </div>
  );
}
