import { useEffect, useState } from "react";
import { Voucher } from "./VoucherList";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/toast-context";
import { getServerApiBase } from "@/lib/http";
import { buildAuthHeader } from "@/lib/auth-helpers";
import { Calendar, Percent, Tag } from "lucide-react";

interface EditVoucherPopupProps {
  open: boolean;
  voucher: Voucher | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditVoucherPopup({
  open,
  voucher,
  onClose,
  onSuccess,
}: EditVoucherPopupProps) {
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [maxUsage, setMaxUsage] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (voucher) {
      setCode(voucher.Code || "");
      setDiscountPercent(voucher.DiscountPercent || 0);
      setDiscountAmount(voucher.DiscountAmount || 0);
      setMinOrderValue(voucher.MinOrderValue || 0);
      setMaxUsage(voucher.MaxUsage || 0);
      setDiscountType(voucher.DiscountPercent ? "percent" : "amount");
      // Format date for input field (YYYY-MM-DD)
      const date = new Date(voucher.ExpiryDate);
      const formattedDate = date.toISOString().split("T")[0];
      setExpiryDate(formattedDate);
    }
  }, [voucher]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("Voucher code is required");
      return;
    }

    if (discountType === "percent" && (discountPercent <= 0 || discountPercent > 100)) {
      setError("Discount percentage must be between 1 and 100");
      return;
    }

    if (discountType === "amount" && discountAmount <= 0) {
      setError("Discount amount must be greater than 0");
      return;
    }

    if (!expiryDate) {
      setError("Expiry date is required");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        VoucherID: voucher?.VoucherID,
        Code: code,
        ExpiryDate: expiryDate,
      };

      if (discountType === "percent") {
        payload.DiscountPercent = discountPercent;
      } else {
        payload.DiscountAmount = discountAmount;
      }

      if (minOrderValue > 0) {
        payload.MinOrderValue = minOrderValue;
      }

      if (maxUsage > 0) {
        payload.MaxUsage = maxUsage;
      }

      const base = getServerApiBase();
      const res = await fetch(`${base}/enterprise/voucher`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeader(),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (!res.ok) {
        showToast("Failed to update voucher. Please try again.", "error", 5000);
        return;
      }
      
      showToast("Voucher updated successfully!", "success", 3000);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update voucher:", err);
      showToast("Failed to update voucher. Please try again.", "error", 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
          Edit Voucher
        </h2>
        <p className="mt-1 text-[12px] leading-4 font-normal text-[oklch(0.551_0.027_264.364)]">
          Update voucher details for your shop
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <label className="mb-2 block text-[12px] leading-4 font-medium text-gray-700">
              <Tag className="mr-2 inline h-4 w-4" />
              Voucher Code *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border-0 px-4 py-3 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] ring ring-inset ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-70"
              placeholder="Enter voucher code"
            />
          </div>

          {/* Discount Type Selection */}
          <div>
            <label className="mb-2 block text-[12px] leading-4 font-medium text-gray-700">
              Discount Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`flex-1 rounded-lg border px-4 py-3 text-[13px] leading-4 font-medium transition-colors ${
                  discountType === "percent"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Percent className="mr-2 inline h-4 w-4" />
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("amount")}
                className={`flex-1 rounded-lg border px-4 py-3 text-[13px] leading-4 font-medium transition-colors ${
                  discountType === "amount"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Tag className="mr-2 inline h-4 w-4" />
                Fixed Amount
              </button>
            </div>
          </div>

          {/* Discount Value */}
          {discountType === "percent" ? (
            <div>
              <label className="mb-2 block text-[12px] leading-4 font-medium text-gray-700">
                <Percent className="mr-2 inline h-4 w-4" />
                Discount Percentage *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                disabled={loading}
                className="w-full rounded-lg border-0 px-4 py-3 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] ring ring-inset ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-70"
                placeholder="Enter discount percentage (1-100)"
              />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-[12px] leading-4 font-medium text-gray-700">
                <Tag className="mr-2 inline h-4 w-4" />
                Discount Amount *
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  $
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  disabled={loading}
                  className="w-full rounded-lg border-0 px-4 py-3 pl-8 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] ring ring-inset ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-70"
                  placeholder="Enter discount amount"
                />
              </div>
            </div>
          )}

          {/* Minimum Order Value */}
          <div>
            <label className="mb-2 block text-[12px] leading-4 font-medium text-gray-700">
              <Tag className="mr-2 inline h-4 w-4" />
              Minimum Order Value (Optional)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                $
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(Number(e.target.value))}
                disabled={loading}
                className="w-full rounded-lg border-0 px-4 py-3 pl-8 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] ring ring-inset ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-70"
                placeholder="Enter minimum order value"
              />
            </div>
          </div>

          {/* Max Usage */}
          <div>
            <label className="mb-2 block text-[12px] leading-4 font-medium text-gray-700">
              <Tag className="mr-2 inline h-4 w-4" />
              Max Usage (Optional)
            </label>
            <input
              type="number"
              min="1"
              value={maxUsage}
              onChange={(e) => setMaxUsage(Number(e.target.value))}
              disabled={loading}
              className="w-full rounded-lg border-0 px-4 py-3 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] ring ring-inset ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-70"
              placeholder="Enter max usage (leave 0 for unlimited)"
            />
            <p className="mt-1 text-xs leading-4 font-normal text-gray-500">
              Maximum number of times this voucher can be used. Leave 0 for unlimited usage.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[12px] leading-4 font-medium text-gray-700">
              <Calendar className="mr-2 inline h-4 w-4" />
              Expiry Date *
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border-0 px-4 py-3 text-[12px] leading-4 font-normal text-[oklch(0.208_0.042_265.755)] ring ring-inset ring-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-70"
            />
          </div>

          {error && <p className="text-xs leading-4 font-normal text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md border bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-[13px] leading-4 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 text-[13px] leading-4 font-medium"
          >
            {loading ? "Saving..." : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
