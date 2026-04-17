"use client";

import { Copy, Hash, MapPin, Truck, User } from "lucide-react";
import type { EnterpriseOrderDetail } from "@/services/order-management.service";

export function OrderInformationCard(props: {
  order: EnterpriseOrderDetail;
  buyerName: string;
  buyerPhone: string;
  timelineExpanded: boolean;
  logisticsTimelineItems: Array<{ title: string; formattedDate: string }>;
  onToggleTimeline: () => void;
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

        {/* Logistics Information */}
        <div>
          <div className="mb-3 flex items-start gap-2">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]" />
            <h3 className="font-medium">Logistics Information</h3>
          </div>
          <div className="ml-7 space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-900">Parcel:</span>
              <span className="text-gray-600">Local Courier</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-900">Tracking Number:</span>
              <span className="font-mono text-gray-600">—</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-900">Rider:</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                <User className="h-4 w-4 text-blue-600" />
              </span>
              <span className="text-gray-600">—</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {order.orderDetails.slice(0, 3).map((item) => (
                  <div
                    key={item.orderDetailId}
                    className="h-10 w-10 overflow-hidden rounded border-2 border-white bg-gray-100"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                ))}
              </div>
              <span className="text-gray-600">Total {order.orderDetails.length} products</span>
            </div>

            {/* Shipment status timeline */}
            <div className="rounded bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#2563FF]" />
                  {props.logisticsTimelineItems.length > 1 ? (
                    <div className="mt-1 h-12 w-px bg-gray-300" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 items-start justify-between">
                  <div>
                    <p className="text-sm text-[#2563FF]">{props.logisticsTimelineItems[0]?.title}</p>
                    <p className="text-xs text-gray-400">
                      {props.logisticsTimelineItems[0]?.formattedDate}
                    </p>
                  </div>
                  {props.logisticsTimelineItems.length > 1 ? (
                    <button
                      type="button"
                      className="ml-4 flex-shrink-0 text-sm text-gray-600 hover:text-gray-900"
                      onClick={props.onToggleTimeline}
                    >
                      {props.timelineExpanded ? "Collapse" : "Expand"}
                    </button>
                  ) : null}
                </div>
              </div>

              {props.timelineExpanded && props.logisticsTimelineItems.length > 1 ? (
                <div className="space-y-3">
                  {props.logisticsTimelineItems.slice(1).map((entry, i) => (
                    <div key={`${entry.title}-${i}`} className="m-0 flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400" />
                        {i < props.logisticsTimelineItems.length - 2 ? (
                          <div className="mt-1 h-12 w-px bg-gray-300" />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{entry.title}</p>
                        <p className="text-xs text-gray-400">{entry.formattedDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

