"use client";

import { useParams } from "next/navigation";
import { CommissionFeeRuleEditPage } from "@/components/admin/finance/commission-fees/CommissionFeeRuleEditPage";

export default function AdminCommissionFeeRuleEditRoutePage() {
  const params = useParams();
  const commissionDefaultId =
    typeof params?.commissionDefaultId === "string" ? params.commissionDefaultId : "";

  if (!commissionDefaultId) {
    return (
      <div className="py-16 text-center text-[13px] leading-4 text-slate-500">
        Invalid rule id.
      </div>
    );
  }

  return (
    <CommissionFeeRuleEditPage
      key={commissionDefaultId}
      commissionDefaultId={commissionDefaultId}
    />
  );
}
