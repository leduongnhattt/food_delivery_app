import { useEffect, useState } from "react";
import { apiClient } from "@/services/api";
import { Voucher } from "./VoucherList";
import { Button } from "@/components/ui/button";
import { useToast } from "@/contexts/toast-context";

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

      const response = await apiClient.put("/enterprise/voucher", payload) as any;
      
      if (response.success === false) {
        showToast(response.error || "Failed to update voucher. Please try again.", "error", 5000);
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
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Edit Voucher</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Voucher Code *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter voucher code"
            />
          </div>

          {/* Discount Type Selection */}
          <div>
            <label className="block text-sm font-medium">Discount Type</label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setDiscountType("percent")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  discountType === "percent"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("amount")}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  discountType === "amount"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Fixed Amount
              </button>
            </div>
          </div>

          {/* Discount Value */}
          {discountType === "percent" ? (
            <div>
              <label className="block text-sm font-medium">
                Discount Percentage *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                disabled={loading}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
                placeholder="Enter discount percentage (1-100)"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium">
                Discount Amount *
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  $
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  disabled={loading}
                  className="w-full border rounded-md px-3 py-2 pl-8 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="Enter discount amount"
                />
              </div>
            </div>
          )}

          {/* Minimum Order Value */}
          <div>
            <label className="block text-sm font-medium">
              Minimum Order Value (Optional)
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                $
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(Number(e.target.value))}
                disabled={loading}
                className="w-full border rounded-md px-3 py-2 pl-8 focus:outline-none focus:ring focus:ring-blue-300"
                placeholder="Enter minimum order value"
              />
            </div>
          </div>

          {/* Max Usage */}
          <div>
            <label className="block text-sm font-medium">
              Max Usage (Optional)
            </label>
            <input
              type="number"
              min="1"
              value={maxUsage}
              onChange={(e) => setMaxUsage(Number(e.target.value))}
              disabled={loading}
              className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
              placeholder="Enter max usage (leave 0 for unlimited)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of times this voucher can be used. Leave 0 for unlimited usage.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Expiry Date *</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={loading}
              className="w-full border rounded-md px-3 py-2 mt-1 focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
