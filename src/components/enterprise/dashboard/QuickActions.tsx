"use client";

import { TrendingUp, ShoppingCart, Star } from "lucide-react";
import { ENTERPRISE_PANEL_CLASS } from "@/components/enterprise/EnterprisePageHeader";

const actionBtn =
  "flex w-full items-center justify-center gap-2 p-4 text-[13px] font-medium text-slate-900 transition hover:bg-slate-50";

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <button type="button" onClick={() => (window.location.href = "/enterprise/analytics")} className={`${ENTERPRISE_PANEL_CLASS} ${actionBtn}`}>
        <TrendingUp className="h-5 w-5 text-sky-700" />
        <span>View Analytics</span>
      </button>
      <button type="button" onClick={() => (window.location.href = "/enterprise/orders")} className={`${ENTERPRISE_PANEL_CLASS} ${actionBtn}`}>
        <ShoppingCart className="h-5 w-5 text-sky-700" />
        <span>Manage Orders</span>
      </button>
      <button type="button" onClick={() => (window.location.href = "/enterprise/reviews")} className={`${ENTERPRISE_PANEL_CLASS} ${actionBtn}`}>
        <Star className="h-5 w-5 text-amber-600" />
        <span>View Reviews</span>
      </button>
    </div>
  );
}
