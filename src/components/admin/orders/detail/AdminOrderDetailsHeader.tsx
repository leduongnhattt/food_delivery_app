"use client";

import { useRouter } from "next/navigation";

export function AdminOrderDetailsHeader({
  orderId,
}: {
  orderId: string;
}) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => router.push("/admin/orders")}
        className="inline-flex items-center gap-2 text-[12px] font-medium text-slate-600 hover:text-slate-900"
      >
        <span aria-hidden>←</span>
        Back to Order List
      </button>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-medium text-slate-500">Order Details</div>
          <div className="mt-1 font-mono text-[18px] leading-[22px] font-semibold text-slate-900">
            #{orderId}
          </div>
        </div>
      </div>
    </div>
  );
}

