"use client";

import { ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { money } from "./order-detail-helpers";

export function BuyerPaymentCard(props: {
  buyerPaymentExpanded: boolean;
  onToggle: () => void;
  merchandiseSubtotal: number;
  shippingFeePaidByBuyer: number;
  discount: number;
  orderTotal: number;
}) {
  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-6">
      <button
        type="button"
        className="flex w-full items-center justify-between transition-opacity hover:opacity-80"
        onClick={props.onToggle}
      >
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[#2563FF]" />
          <h3 className="font-medium">Buyer Payment</h3>
        </div>
        <div className="flex items-center gap-2">
          <span>{money(props.orderTotal)}</span>
          {props.buyerPaymentExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          props.buyerPaymentExpanded ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-4 space-y-2 border-t border-gray-200 pt-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Merchandise Subtotal</span>
            <span className="text-gray-900">{money(props.merchandiseSubtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping Fee</span>
            <span className="text-gray-900">{money(props.shippingFeePaidByBuyer)}</span>
          </div>
          {props.discount > 0 ? (
            <div className="flex justify-between">
              <span className="text-gray-600">Discount</span>
              <span className="text-gray-900">-{money(props.discount)}</span>
            </div>
          ) : null}
          <div className="my-2 h-px bg-gray-200" />
          <div className="flex justify-between">
            <span className="font-medium">Total Buyer Payment</span>
            <span className="font-medium">{money(props.orderTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

