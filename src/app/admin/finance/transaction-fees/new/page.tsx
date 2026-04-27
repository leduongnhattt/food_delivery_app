import { Suspense } from "react";
import { TransactionFeeCreatePage } from "@/components/admin/finance/transaction-fees/TransactionFeeCreatePage";

export default function AdminTransactionFeeCreateRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
      <TransactionFeeCreatePage />
    </Suspense>
  );
}

