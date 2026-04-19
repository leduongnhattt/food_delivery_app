"use client";

import { Banknote } from "lucide-react";
import { money } from "./order-detail-helpers";

export function FinalAmountCard(props: { totalAmount: number }) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Banknote className="h-5 w-5 text-[#2563FF]" />
          <h3 className="font-medium">Final Amount</h3>
        </div>
        <div className="flex w-[160px] items-center justify-end border-l border-gray-200 pl-4 text-right tabular-nums">
          <span className="text-2xl font-semibold text-[#2563FF] mr-[10px]">
            {money(props.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}

