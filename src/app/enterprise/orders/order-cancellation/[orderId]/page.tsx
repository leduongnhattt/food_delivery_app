import { Suspense } from "react";
import { EnterpriseOrderCancellationDetailPageClient } from "@/components/enterprise/orders/cancellation/EnterpriseOrderCancellationDetailPageClient";

export default function EnterpriseOrderCancellationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
            <p className="text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
              Loading order…
            </p>
          </div>
        </div>
      }
    >
      <EnterpriseOrderCancellationDetailPageClient />
    </Suspense>
  );
}

