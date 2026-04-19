"use client";

import { MapPin, Truck, X } from "lucide-react";

export type DeliveryMethod = "SelfDelivery" | "ThirdParty";

export function ArrangeShipmentModal(props: {
  open: boolean;
  orderIdLabel: string;
  selected: DeliveryMethod | null;
  onSelect: (m: DeliveryMethod) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmLabel?: string;
}) {
  if (!props.open) return null;

  const cardBase =
    "flex-1 rounded-lg border p-6 min-h-[210px] text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563FF]/30";
  const activeCard = "border-[#2563FF] bg-blue-50";
  const inactiveCard = "border-gray-200 bg-white hover:bg-gray-50";
  const disabledCard = "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed";

  const confirmLabel = props.confirmLabel ?? "Confirm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Ship Order</h2>
            <p className="mt-1 text-sm text-gray-500 truncate">Order {props.orderIdLabel}</p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => props.onSelect("SelfDelivery")}
              className={`${cardBase} ${
                props.selected === "SelfDelivery" ? activeCard : inactiveCard
              }`}
            >
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
                <MapPin className="h-5 w-5 text-[#2563FF]" />
              </div>
              <div className="text-sm font-semibold text-gray-900">I Will Self Deliver</div>
              <div className="mt-1 text-xs text-gray-500">
                Your shop will handle delivery to the buyer.
              </div>
            </button>

            <button type="button" disabled className={`${cardBase} ${disabledCard}`}>
              <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gray-200">
                <Truck className="h-5 w-5 text-gray-500" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="text-sm font-semibold text-gray-900">Third-party Delivery</div>
                <span className="rounded bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                  Coming soon
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Integrate a delivery partner (not available yet).
              </div>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={props.onClose}
            className="h-9 rounded border border-gray-300 bg-white px-4 text-sm text-gray-900 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            disabled={props.confirmDisabled}
            className="h-9 rounded bg-[#2563FF] px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

