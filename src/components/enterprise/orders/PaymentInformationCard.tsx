"use client";

import { ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import type { EnterpriseOrderDetail } from "@/services/order-management.service";
import { money } from "./order-detail-helpers";

export function PaymentInformationCard(props: {
  order: EnterpriseOrderDetail;
  incomeDetailsExpanded: boolean;
  merchandiseSubtotal: number;
  shippingFeePaidByBuyer: number;
  commission: number;
  netEstimate: number;
  onToggleIncomeDetails: () => void;
  onViewTransactionHistory: () => void;
}) {
  const { order } = props;

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-3 flex items-start gap-2">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]" />
        <div className="flex flex-1 items-center justify-between">
          <h3 className="font-medium">Payment Information</h3>
          <button
            type="button"
            className="text-xs font-medium text-[#0070f0] hover:text-[#0050c0]"
            onClick={props.onViewTransactionHistory}
          >
            View transaction history
          </button>
        </div>
      </div>

      <div>
        <div className="ml-7 overflow-hidden rounded border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-center font-medium text-gray-600">No.</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product(s)</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Unit Price</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Quantity</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.orderDetails.map((item, idx) => (
                <tr key={item.orderDetailId} className="border-t border-gray-100">
                  <td className="px-4 py-3 align-top text-center">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-gray-900">{item.dishName || "—"}</p>
                        <p className="mt-1 text-xs text-gray-500">—</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-right">{money(item.unitPrice)}</td>
                  <td className="px-4 py-3 align-top text-right">{item.quantity}</td>
                  <td className="px-4 py-3 align-top text-right">{money(item.subTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relative mt-4 border-b border-dashed border-gray-300">
          <div className="absolute -top-2 right-0">
            <button
              type="button"
              className="bg-white px-2 text-xs text-gray-600 hover:text-gray-900"
              onClick={props.onToggleIncomeDetails}
            >
              <span>{props.incomeDetailsExpanded ? "Hide Income Details" : "Show Income Details"}</span>
              {props.incomeDetailsExpanded ? (
                <ChevronUp className="ml-1 inline h-3 w-3" />
              ) : (
                <ChevronDown className="ml-1 inline h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {props.incomeDetailsExpanded ? (
          <div className="px-4 py-4">
            <div className="flex justify-end text-sm">
              <div className="mr-8 space-y-2 text-right">
                <div className="text-gray-900">Merchandise Subtotal</div>
                <div className="text-sm text-gray-500">Product Price</div>
                <div className="text-gray-900">Shipping Subtotal</div>
                <div className="text-sm text-gray-500">Shipping Fee Paid by Buyer</div>
                <div className="text-sm text-gray-500">Shipping Fee Charged by Logistic Provider</div>
                <div className="text-gray-900">Fees &amp; Charges</div>
                <div className="flex items-center justify-end gap-1 pt-1.5 font-medium text-gray-900">
                  Order Income
                </div>
              </div>

              <div className="min-w-[130px] space-y-2 border-l border-dashed border-gray-300 pl-3 text-right">
                <div className="text-gray-900">{money(props.merchandiseSubtotal)}</div>
                <div className="text-sm text-gray-500">{money(props.merchandiseSubtotal)}</div>
                <div className="text-gray-900">{money(props.shippingFeePaidByBuyer)}</div>
                <div className="text-sm text-gray-500">{money(props.shippingFeePaidByBuyer)}</div>
                <div className="text-sm text-gray-500">{money(0)}</div>
                <div className="text-gray-900">-{money(props.commission)}</div>
                <div className="text-2xl font-medium text-[#2563FF]">{money(props.netEstimate)}</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

