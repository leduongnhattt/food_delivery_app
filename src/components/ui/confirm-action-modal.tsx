"use client";

import type { ReactNode } from "react";

/** Same pattern as `kltn-portal/src/components/enterprise/ConfirmActionModal.tsx` */
export function ConfirmActionModal(props: {
  open: boolean;
  title: string;
  message: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  confirmTone?: "primary" | "danger";
  confirmLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!props.open) return null;

  const confirmCls =
    props.confirmTone === "danger"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-[#2563FF] hover:bg-[#1d4ed8]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) props.onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 py-3">
          <div className="text-base font-semibold text-gray-900">{props.title}</div>
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
            disabled={props.confirmLoading}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 text-sm leading-6 text-slate-600">{props.message}</div>

        <div className="flex items-center justify-end gap-3 px-6 pb-4">
          <button
            type="button"
            onClick={props.onClose}
            className="h-10 rounded-xl border border-gray-200 bg-white px-6 text-sm font-medium text-gray-900 hover:bg-gray-50"
            disabled={props.confirmLoading}
          >
            {props.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={props.onConfirm}
            className={`h-10 rounded-xl px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${confirmCls}`}
            disabled={props.confirmLoading}
          >
            {props.confirmLoading ? "Processing…" : props.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
