"use client";

import type { LucideIcon } from "lucide-react";

export function StatusCard(props: {
  icon: LucideIcon;
  message: string | null;
  showCancelOrder: boolean;
  showViewPickup: boolean;
  actionLoading: boolean;
  onCancel: () => void;
  onViewPickup: () => void;
  extraActions?: React.ReactNode;
}) {
  const Icon = props.icon;
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">Order</p>
            </div>
          </div>
        </div>

        {props.message ? <p className="ml-7 text-sm text-gray-700">{props.message}</p> : null}

        {props.extraActions || props.showViewPickup || props.showCancelOrder ? (
          <div className="space-y-3">
            <div className="flex justify-end gap-2">
              {props.extraActions}
              {props.showCancelOrder ? (
                <button
                  type="button"
                  disabled={props.actionLoading}
                  onClick={props.onCancel}
                  className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 disabled:opacity-60"
                >
                  Cancel Order
                </button>
              ) : null}
              {props.showViewPickup ? (
                <button
                  type="button"
                  onClick={props.onViewPickup}
                  className="rounded border border-[#2563FF] bg-gray-50 px-3 py-1.5 text-sm text-[#2563FF] hover:bg-[#2563FF] hover:text-white"
                >
                  View Pickup Details
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

