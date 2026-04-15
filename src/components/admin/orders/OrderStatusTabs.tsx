"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const ORDER_STATUSES = [
  { key: "all", label: "All" },
  { key: "Pending", label: "Pending" },
  { key: "Confirmed", label: "Confirmed" },
  { key: "Preparing", label: "Preparing" },
  { key: "ReadyForPickup", label: "Ready" },
  { key: "OutForDelivery", label: "Delivering" },
  { key: "Delivered", label: "Delivered" },
  { key: "Completed", label: "Completed" },
  { key: "Cancelled", label: "Cancelled" },
  { key: "Refunded", label: "Refunded" },
] as const;

type OrderStatusKey = (typeof ORDER_STATUSES)[number]["key"];

export default function OrderStatusTabs({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleTabSelect = (nextStatus: string) => {
    if (nextStatus === current) return;
    const p = new URLSearchParams(searchParams.toString());
    if (nextStatus === "all") {
      p.delete("status");
    } else {
      p.set("status", nextStatus);
    }
    // Reset cursor on tab change
    p.delete("cursor");
    startTransition(() => {
      router.replace(`/admin/orders?${p.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden min-w-max">
        {ORDER_STATUSES.map((tab, idx) => {
          const isActive =
            current === tab.key ||
            (tab.key === "all" && (!current || current === "all"));
          const isLast = idx === ORDER_STATUSES.length - 1;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabSelect(tab.key)}
              aria-current={isActive ? "page" : undefined}
              disabled={isPending}
              className={[
                "px-3 py-2 text-[12px] font-medium transition-colors whitespace-nowrap",
                !isLast ? "border-r border-slate-200" : "",
                isActive
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50",
                isPending ? "opacity-60 pointer-events-none" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
