"use client";

import { mergeClasses } from "@/lib/utils";

export type AdminOrderDetailsTab = "order_info" | "status_timeline";

const TABS: Array<{ id: AdminOrderDetailsTab; label: string }> = [
  { id: "order_info", label: "Order Information" },
  { id: "status_timeline", label: "Status & Timeline" },
];

export function AdminOrderDetailsTabs({
  value,
  onChange,
}: {
  value: AdminOrderDetailsTab;
  onChange: (t: AdminOrderDetailsTab) => void;
}) {
  return (
    <div className="border-b border-slate-200">
      <div className="flex flex-wrap items-center gap-6 px-1">
        {TABS.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={mergeClasses(
                "relative -mb-px py-2 text-[12px] font-medium transition-colors",
                active ? "text-[#2563FF]" : "text-slate-500 hover:text-slate-700",
              )}
            >
              {t.label}
              {active ? (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#2563FF]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

