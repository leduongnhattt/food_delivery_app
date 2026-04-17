"use client";

import { Copy, Hash, MapPin, Truck } from "lucide-react";
import type { EnterpriseOrderDetail } from "@/services/order-management.service";

export function OrderInformationCardCancel(props: {
  order: EnterpriseOrderDetail;
  buyerName: string;
  buyerPhone: string;
  shippingTimelineItems: Array<{ title: string; formattedDate: string }>;
  onCopyOrderId: () => void;
}) {
  const { order } = props;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="space-y-6">
        {/* Order ID */}
        <div>
          <div className="mb-3 flex items-start gap-2">
            <Hash className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]" />
            <h3 className="font-medium">Order ID</h3>
          </div>
          <div className="flex items-center gap-2 pl-7">
            <span className="text-sm text-gray-900">{order.orderId}</span>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded p-0.5 text-[#0070f0] hover:text-[#0050c0]"
              onClick={props.onCopyOrderId}
              aria-label="Copy Order ID"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Delivery Address */}
        <div>
          <div className="mb-3 flex items-start gap-2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]" />
            <h3 className="font-medium">Delivery Address</h3>
          </div>
          <div className="space-y-1 pl-7 text-sm">
            <p className="text-gray-900">{props.buyerName}</p>
            <p className="text-gray-600">{props.buyerPhone}</p>
            <p className="text-gray-600">{order.deliveryAddress}</p>
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Shipping */}
        <div>
          <div className="mb-3 flex items-start gap-2">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]" />
            <h3 className="font-medium text-gray-900">Shipping</h3>
          </div>
          <div className="ml-7 text-sm">
            <div className="font-semibold text-red-600">{props.shippingTimelineItems[0]?.title}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

