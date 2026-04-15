import { Suspense } from "react";
import { EnterpriseOrdersPageClient } from "@/components/enterprise/orders/EnterpriseOrdersPageClient";

function OrdersLoadingFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
        <p className="text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
          Loading orders…
        </p>
      </div>
    </div>
  );
}

export default function EnterpriseOrdersPage() {
  return (
    <Suspense fallback={<OrdersLoadingFallback />}>
      <EnterpriseOrdersPageClient />
    </Suspense>
  );
}
