import { Suspense } from "react";
import { EnterpriseOrderCancellationPageClient } from "@/components/enterprise/orders/cancellation/EnterpriseOrderCancellationPageClient";

export default function EnterpriseOrderCancellationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
            <p className="text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
              Loading cancellations…
            </p>
          </div>
        </div>
      }
    >
      <EnterpriseOrderCancellationPageClient />
    </Suspense>
  )
}
