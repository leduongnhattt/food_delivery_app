"use client";

export function CancelOrderDialog(props: {
  open: boolean;
  actionLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Cancel this order?</h3>
        <p className="mt-2 text-sm text-gray-600">
          This will set the order to <strong>Cancelled</strong>. Pending payments will be marked
          failed. This cannot be undone from the enterprise dashboard.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
            onClick={props.onClose}
          >
            Back
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            disabled={props.actionLoading}
            onClick={props.onConfirm}
          >
            Confirm cancel
          </button>
        </div>
      </div>
    </div>
  );
}

