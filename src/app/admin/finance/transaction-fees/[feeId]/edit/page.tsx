"use client";

import { useParams } from "next/navigation";
import { TransactionFeeRuleEditPage } from "@/components/admin/finance/transaction-fees/TransactionFeeRuleEditPage";

export default function AdminTransactionFeeRuleEditRoutePage() {
  const params = useParams();
  const feeId = typeof params?.feeId === "string" ? params.feeId : "";

  if (!feeId) {
    return (
      <div className="py-16 text-center text-[13px] leading-4 text-slate-500">
        Invalid fee id.
      </div>
    );
  }

  return <TransactionFeeRuleEditPage key={feeId} feeId={feeId} />;
}
