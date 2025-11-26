"use client";
import { apiClient } from "@/services/api";
import { useEffect, useState } from "react";
import { Voucher, VoucherList } from "./VoucherList";
import { Button } from "@/components/ui/button";
import EditVoucherPopup from "./EditVoucherPopup";
import { useToast } from "@/contexts/toast-context";
import { Calendar, Percent, Tag, Plus, Sparkles } from "lucide-react";
import VoucherSearch from "@/components/enterprise/VoucherSearch";
import TabsVouchers from "@/components/enterprise/TabsVouchers";
import { useSearchParams } from "next/navigation";

export default function AdminDashboardPage() {
  const [entepriseData, setEnterpriseData] = useState<any>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  
  // Get search and filter parameters
  const status = (searchParams.get('status') || 'all') as 'all' | 'approved' | 'pending';
  const search = searchParams.get('q') || '';

  // form states
  const [couponCode, setCouponCode] = useState("");
  const [expire, setExpire] = useState("");
  const [percentDiscount, setPercentDiscount] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUsage, setMaxUsage] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [loading, setLoading] = useState(false);

  // validation states
  const [errors, setErrors] = useState({
    couponCode: "",
    expire: "",
    percentDiscount: "",
    discountAmount: "",
    minOrderValue: "",
    maxUsage: "",
  });

  async function fetchEnterpriseData() {
    try {
      const response = await apiClient.get<{ enterprise: any }>(
        "/enterprise/profile?include=vouchers"
      ) as any;
      
      if (response.success === false) {
        console.error("Error fetching enterprise data:", response.error);
        return;
      }
      
      const { enterprise } = response;
      setEnterpriseData(enterprise);
    } catch (error) {
      console.error("Error fetching enterprise data:", error);
    }
  }

  useEffect(() => {
    fetchEnterpriseData();
  }, []);

  const validateCouponCode = (value: string) => {
    if (!value.trim()) {
      return "Coupon code is required";
    }
    if (value.length < 3) {
      return "Coupon code must be at least 3 characters";
    }
    if (value.length > 20) {
      return "Coupon code must be less than 20 characters";
    }
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      return "Coupon code can only contain letters, numbers, hyphens, and underscores";
    }

    // Check if code already exists
    const existingCodes =
      entepriseData?.vouchers?.map((v: Voucher) => v.Code) || [];
    if (existingCodes.includes(value)) {
      return "This coupon code already exists";
    }

    return "";
  };

  const validateExpireDate = (value: string) => {
    if (!value.trim()) {
      return "Expire date is required";
    }

    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    if (selectedDate <= today) {
      return "Expire date must be in the future";
    }

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5); // Max 5 years from now

    if (selectedDate > maxDate) {
      return "Expire date cannot be more than 5 years from now";
    }

    return "";
  };

  const validatePercentDiscount = (value: string) => {
    if (!value.trim()) {
      return "Percent discount is required";
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return "Percent discount must be a valid number";
    }

    if (numValue <= 0) {
      return "Percent discount must be greater than 0";
    }

    if (numValue > 100) {
      return "Percent discount cannot exceed 100%";
    }

    // Check for too many decimal places
    if (value.includes(".") && value.split(".")[1].length > 2) {
      return "Percent discount can have at most 2 decimal places";
    }

    return "";
  };

  const validateDiscountAmount = (value: string) => {
    if (!value.trim()) {
      return "Discount amount is required";
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return "Discount amount must be a valid number";
    }

    if (numValue <= 0) {
      return "Discount amount must be greater than 0";
    }

    // Check for too many decimal places
    if (value.includes(".") && value.split(".")[1].length > 2) {
      return "Discount amount can have at most 2 decimal places";
    }

    return "";
  };

  const validateMinOrderValue = (value: string) => {
    if (!value.trim()) return ""; // Optional field

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return "Minimum order value must be a valid number";
    }

    if (numValue < 0) {
      return "Minimum order value cannot be negative";
    }

    return "";
  };

  const validateMaxUsage = (value: string) => {
    if (!value.trim()) return ""; // Optional field

    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      return "Max usage must be a valid number";
    }

    if (numValue <= 0) {
      return "Max usage must be greater than 0";
    }

    return "";
  };

  const validateAllFields = () => {
    const newErrors = {
      couponCode: validateCouponCode(couponCode),
      expire: validateExpireDate(expire),
      percentDiscount: discountType === "percent" ? validatePercentDiscount(percentDiscount) : "",
      discountAmount: discountType === "amount" ? validateDiscountAmount(discountAmount) : "",
      minOrderValue: validateMinOrderValue(minOrderValue),
      maxUsage: validateMaxUsage(maxUsage),
    };

    setErrors(newErrors);

    // Return true if no errors
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleCouponCodeChange = (value: string) => {
    setCouponCode(value);
    if (errors.couponCode) {
      setErrors((prev) => ({ ...prev, couponCode: validateCouponCode(value) }));
    }
  };

  const handleExpireChange = (value: string) => {
    setExpire(value);
    if (errors.expire) {
      setErrors((prev) => ({ ...prev, expire: validateExpireDate(value) }));
    }
  };

  const handlePercentDiscountChange = (value: string) => {
    setPercentDiscount(value);
    if (errors.percentDiscount) {
      setErrors((prev) => ({
        ...prev,
        percentDiscount: validatePercentDiscount(value),
      }));
    }
  };

  const handleAddVoucher = async () => {
    if (!validateAllFields()) {
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        Code: couponCode.trim(),
        ExpiryDate: expire,
      };

      if (discountType === "percent") {
        payload.DiscountPercent = parseFloat(percentDiscount);
      } else {
        payload.DiscountAmount = parseFloat(discountAmount);
      }

      if (minOrderValue.trim()) {
        payload.MinOrderValue = parseFloat(minOrderValue);
      }

      if (maxUsage.trim()) {
        payload.MaxUsage = parseInt(maxUsage);
      }

      await apiClient.post("/enterprise/voucher", payload);
      setCouponCode("");
      setExpire("");
      setPercentDiscount("");
      setDiscountAmount("");
      setMinOrderValue("");
      setMaxUsage("");
      setErrors({ couponCode: "", expire: "", percentDiscount: "", discountAmount: "", minOrderValue: "", maxUsage: "" });
      showToast("Voucher created successfully!", "success");
      fetchEnterpriseData();
    } catch (error) {
      console.error("Error adding voucher:", error);
      showToast("Failed to add voucher. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
  };


  // Filter vouchers based on search and status
  const filteredVouchers = (entepriseData?.vouchers || []).filter((voucher: Voucher) => {
    // Filter by status
    if (status === 'approved' && voucher.Status !== 'Approved') return false;
    if (status === 'pending' && voucher.Status !== 'Pending') return false;
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      return voucher.Code.toLowerCase().includes(searchLower);
    }
    
    return true;
  });

  return (
    <div className="relative">
      {/* Decorative Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50" />
        <div className="absolute -top-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-orange-200/30 blur-2xl" />
      </div>

      {/* Header */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-2xl border border-white/50 bg-white/70 p-6 shadow-md backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Voucher Management</h1>
              <p className="mt-1 text-sm text-gray-600">Create and manage discount vouchers for your customers.</p>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-600">
                {entepriseData?.vouchers?.length || 0} Active Vouchers
              </span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Create Voucher Form */}
          <div className="lg:col-span-5">
            <div className="sticky top-4 space-y-6">
              {/* Create Voucher Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Plus className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Create New Voucher</h3>
                    <p className="text-sm text-gray-500">Set up discount codes for your customers</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Coupon Code */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <Tag className="mr-2 inline h-4 w-4" />
                      Coupon Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., SAVE20, WELCOME10"
                      value={couponCode}
                      onChange={(e) => handleCouponCodeChange(e.target.value)}
                      className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.couponCode ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.couponCode && (
                      <p className="mt-1 text-sm text-red-500">{errors.couponCode}</p>
                    )}
                  </div>

                  {/* Discount Type Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Discount Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDiscountType("percent")}
                        className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
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
                        className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
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
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        <Percent className="mr-2 inline h-4 w-4" />
                        Discount Percentage
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0.00"
                          value={percentDiscount}
                          onChange={(e) => handlePercentDiscountChange(e.target.value)}
                          className={`w-full rounded-lg border px-4 py-3 pr-8 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.percentDiscount ? "border-red-300" : "border-gray-300"
                          }`}
                        />
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                          %
                        </div>
                      </div>
                      {errors.percentDiscount && (
                        <p className="mt-1 text-sm text-red-500">{errors.percentDiscount}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        <Tag className="mr-2 inline h-4 w-4" />
                        Discount Amount
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                          $
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          className={`w-full rounded-lg border px-4 py-3 pl-8 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                            errors.discountAmount ? "border-red-300" : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.discountAmount && (
                        <p className="mt-1 text-sm text-red-500">{errors.discountAmount}</p>
                      )}
                    </div>
                  )}

                  {/* Minimum Order Value */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
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
                        placeholder="0.00"
                        value={minOrderValue}
                        onChange={(e) => setMinOrderValue(e.target.value)}
                        className={`w-full rounded-lg border px-4 py-3 pl-8 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                          errors.minOrderValue ? "border-red-300" : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errors.minOrderValue && (
                      <p className="mt-1 text-sm text-red-500">{errors.minOrderValue}</p>
                    )}
                  </div>

                  {/* Max Usage */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <Tag className="mr-2 inline h-4 w-4" />
                      Max Usage (Optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={maxUsage}
                      onChange={(e) => setMaxUsage(e.target.value)}
                      className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.maxUsage ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum number of times this voucher can be used. Leave empty for unlimited usage.
                    </p>
                    {errors.maxUsage && (
                      <p className="mt-1 text-sm text-red-500">{errors.maxUsage}</p>
                    )}
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      <Calendar className="mr-2 inline h-4 w-4" />
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                      max={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                      value={expire}
                      onChange={(e) => handleExpireChange(e.target.value)}
                      className={`w-full rounded-lg border px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.expire ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    {errors.expire && (
                      <p className="mt-1 text-sm text-red-500">{errors.expire}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleAddVoucher}
                    disabled={loading}
                    className="w-full bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Creating...
                      </div>
                    ) : (
                      "Create Voucher"
                    )}
                  </Button>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <div className="text-sm font-medium">Preview Voucher</div>
                      <div className="text-xs opacity-90">How it will appear to customers</div>
                    </div>
                    <div className="rounded-full bg-white/20 p-2">
                      <Tag className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {couponCode || "COUPON_CODE"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {discountType === "percent" 
                          ? (percentDiscount ? `${percentDiscount}% OFF` : "0% OFF")
                          : (discountAmount ? `$${discountAmount} OFF` : "$0 OFF")
                        }
                      </div>
                    </div>
                    <div className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-600">
                      {expire ? new Date(expire).toLocaleDateString('vi-VN') : "Expires Soon"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Voucher List */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Vouchers</h3>
                  <p className="text-sm text-gray-500">Manage existing discount codes</p>
                </div>
                <div className="text-sm text-gray-500">
                  {filteredVouchers.length} of {entepriseData?.vouchers?.length || 0} total
                </div>
              </div>
              
              {/* Search and Tabs Section */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <TabsVouchers current={status} search={search} />
                  <VoucherSearch currentStatus={status} currentSearch={search} />
                </div>
                
                {/* Search Results Info */}
                {(search || status !== 'all') && (
                  <div className="text-sm text-gray-600">
                    {search ? (
                      <span>Found {filteredVouchers.length} voucher{filteredVouchers.length !== 1 ? 's' : ''} matching "{search}"</span>
                    ) : (
                      <span>Showing {filteredVouchers.length} {status} voucher{filteredVouchers.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
              </div>
              
              <VoucherList
                vouchers={filteredVouchers}
                onEdit={handleEdit}
              />
            </div>
          </div>
        </div>
      </div>

      <EditVoucherPopup
        open={!!selectedVoucher}
        voucher={selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        onSuccess={fetchEnterpriseData}
      />
    </div>
  );
}

