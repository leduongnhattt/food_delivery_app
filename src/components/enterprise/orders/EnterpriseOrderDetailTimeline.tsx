"use client";

import { orderStatusLabel } from "@/lib/order-status.labels";

const FLOW = [
  "Pending",
  "Confirmed",
  "Preparing",
  "ReadyForPickup",
  "OutForDelivery",
  "Delivered",
  "Completed",
] as const;

interface Props {
  currentStatus: string;
  orderDate: string;
  deliveredAt: string | null;
}

function idxOf(status: string): number {
  const s = status.trim();
  const i = (FLOW as readonly string[]).indexOf(s);
  return i;
}

export function EnterpriseOrderDetailTimeline({
  currentStatus,
  orderDate,
  deliveredAt,
}: Props) {
  const st = currentStatus.trim();
  if (st === "Cancelled" || st === "Refunded") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <p className="font-semibold">Order ended: {orderStatusLabel(st)}</p>
        <p className="mt-1 text-red-800">
          This order is no longer in the active fulfillment path.
        </p>
      </div>
    );
  }

  const cur = idxOf(st);
  return (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        Ordered: {new Date(orderDate).toLocaleString()}
        {deliveredAt ? (
          <>
            {" "}
            · Delivered: {new Date(deliveredAt).toLocaleString()}
          </>
        ) : null}
      </p>
      <ol className="relative space-y-4 border-l border-gray-200 pl-6">
        {FLOW.map((step, i) => {
          const done = cur >= 0 && i <= cur;
          return (
            <li key={step} className="ml-1">
              <span
                className={`absolute -left-[9px] mt-1.5 h-3 w-3 rounded-full border-2 ${
                  done
                    ? "border-purple-600 bg-purple-600"
                    : "border-gray-300 bg-white"
                }`}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className={`font-medium ${done ? "text-gray-900" : "text-gray-400"}`}>
                  {orderStatusLabel(step)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
