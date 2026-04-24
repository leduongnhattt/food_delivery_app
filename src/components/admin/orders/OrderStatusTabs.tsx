"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { mergeClasses } from "@/lib/utils";
import { ORDER_STATUS_OPTIONS, type OrderStatusKey } from "./order-status";

export default function OrderStatusTabs({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleTabSelect = (nextStatus: OrderStatusKey) => {
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
        {ORDER_STATUS_OPTIONS.map((tab, idx) => {
          const isActive =
            current === tab.key ||
            (tab.key === "all" && (!current || current === "all"));
          const isLast = idx === ORDER_STATUS_OPTIONS.length - 1;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabSelect(tab.key)}
              aria-current={isActive ? "page" : undefined}
              disabled={isPending}
              className={mergeClasses(
                "px-3 py-2 text-[12px] font-medium transition-colors whitespace-nowrap",
                !isLast && "border-r border-slate-200",
                isActive
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50",
                isPending && "opacity-60 pointer-events-none",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
