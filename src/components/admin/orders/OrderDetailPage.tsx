"use client";

import { formatDate } from "@/lib/utils";
import type { AdminOrderDetail } from "@/types/admin-api.types";
import { useRouter } from "next/navigation";
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

export default function OrderDetailPage({
  order,
}: {
  order: AdminOrderDetail;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[14px] font-medium text-slate-800">
            Order Detail
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            View detailed information about this order.
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/orders")}
          className="text-xs px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
        >
          ← Back
        </button>
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Order Info */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm font-medium text-slate-700 mb-3">
            Order Information
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Order ID</span>
              <span className="font-mono text-xs text-slate-700">
                {order.OrderID}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Order Date</span>
              <span className="text-slate-700">
                {formatDate(order.OrderDate)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500">Status</span>
              <span
                className={`text-xs px-2 py-1 rounded border ${
                  statusColorMap[order.Status] ??
                  "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {order.Status}
              </span>
            </div>

            <div className="flex justify-between border-t pt-3">
              <span className="text-slate-500">Total</span>
              <span className="font-semibold text-slate-800">
                {formatPrice(order.TotalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="text-sm font-medium text-slate-700 mb-3">
            Customer Information
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name</span>
              <span className="text-slate-700 font-medium">
                {order.customer.FullName}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Phone</span>
              <span className="text-slate-700">
                {order.customer.PhoneNumber}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Customer ID</span>
              <span className="font-mono text-xs text-slate-500">
                {order.CustomerID}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-medium text-slate-700">
          Order Items
        </div>

        <div className="overflow-x-auto px-4">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-[#f9fbfc] text-left border-b border-slate-200">
                <th className="py-2 pr-4 text-xs font-semibold">Dish</th>
                <th className="py-2 pr-4 text-xs font-semibold">Restaurant</th>
                <th className="py-2 pr-4 text-xs font-semibold">Price</th>
                <th className="py-2 pr-4 text-xs font-semibold">Qty</th>
                <th className="py-2 pr-0 text-xs font-semibold text-right">
                  Subtotal
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {order.orderDetails.map((item) => (
                <tr key={item.FoodID}>
                  <td className="py-2 pr-4 text-slate-700 font-medium">
                    {item.food.DishName}
                  </td>
                  <td className="py-2 pr-4 text-slate-500">
                    {item.food.enterprise.EnterpriseName}
                  </td>
                  <td className="py-2 pr-4 text-slate-600">
                    {formatPrice(item.food.Price)}
                  </td>
                  <td className="py-2 pr-4 text-slate-600">{item.Quantity}</td>
                  <td className="py-2 pr-0 text-right text-slate-700 font-medium">
                    {formatPrice(item.SubTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {order.orderDetails.length === 0 && (
            <div className="text-center text-slate-500 py-6">
              No items found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
