"use client";

import type { EnterpriseOrderTab, EnterpriseToShipSubTab } from "@/lib/enterprise-order-buckets";
import {
  ENTERPRISE_TAB_LABELS,
  TOSHIP_SUB_LABELS,
} from "@/lib/enterprise-order-buckets";

const TAB_ORDER: EnterpriseOrderTab[] = [
  "all",
  "unpaid",
  "to_ship",
  "shipping",
  "completed",
  "return_refund",
];

interface Props {
  tab: EnterpriseOrderTab;
  toShipSub: EnterpriseToShipSubTab;
  onTabChange: (t: EnterpriseOrderTab) => void;
}

export function EnterpriseOrdersPrimaryTabs({
  tab,
  toShipSub,
  onTabChange,
}: Props) {
  return (
    <div className="space-y-2">
      <div
        role="tablist"
        aria-label="Order buckets"
        className="flex flex-wrap gap-6 border-b border-gray-200 pb-1"
      >
        {TAB_ORDER.map((id) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onTabChange(id)}
              className={`relative pb-3 px-2 text-sm transition-colors focus:outline-none ${
                active
                  ? "font-medium text-[#0070f0]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {ENTERPRISE_TAB_LABELS[id]}
              {active ? (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0070f0]" />
              ) : null}
            </button>
          );
        })}
      </div>
      {/* sub-tabs are rendered by the page to match MallPlus filter layout */}
      <span className="sr-only">{TOSHIP_SUB_LABELS[toShipSub]}</span>
    </div>
  );
}
