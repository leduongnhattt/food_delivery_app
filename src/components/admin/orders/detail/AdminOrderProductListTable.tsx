"use client";

import type { AdminOrderDetail } from "@/types/admin-api.types";
import { formatPrice } from "@/lib/utils";

export function AdminOrderProductListTable({ order }: { order: AdminOrderDetail }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3 text-[12px] font-semibold text-slate-700">
        Product List
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-[12px] leading-4">
          <thead>
            <tr className="bg-[#f9fbfc] text-left border-b border-slate-200">
              <th className="py-2 pr-4 pl-4 text-xs font-semibold text-slate-600">Product ID</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Quantity</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Item</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Price Discount</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Subtotal</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Voucher Discount (Platform)</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Voucher Discount (Shop)</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Service Fee</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Service Fee Rule ID</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Commission Fee</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Commission Fee Rule ID</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Seller Transaction Fee</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Refund ID</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Refund Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {order.orderDetails.map((d) => (
              <tr key={`${d.FoodID}:${d.food.enterprise.EnterpriseID}`}>
                <td className="py-2 pr-4 pl-4 font-mono text-[11px] text-slate-600">
                  {d.FoodID.slice(0, 10)}
                </td>
                <td className="py-2 pr-4 text-slate-700">{d.Quantity}</td>
                <td className="py-2 pr-4 text-slate-700 font-medium">{d.food.DishName}</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-700">{formatPrice(d.SubTotal)}</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
                <td className="py-2 pr-4 text-slate-500">—</td>
              </tr>
            ))}

            {order.orderDetails.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-10 text-center text-slate-500">
                  No products
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

