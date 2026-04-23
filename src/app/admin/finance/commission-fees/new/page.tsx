import { Suspense } from "react";
import { CommissionFeeRuleCreatePage } from "@/components/admin/finance/commission-fees/CommissionFeeRuleCreatePage";

export default function AdminCommissionFeeRuleCreateRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <CommissionFeeRuleCreatePage />
    </Suspense>
  );
}

