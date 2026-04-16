"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useAdminSearchInput } from "@/hooks/use-admin-search-input";

const PAYMENT_METHODS = [
  { value: "", label: "All Methods" },
  { value: "Cash", label: "Cash" },
  { value: "CreditCard", label: "Credit Card" },
  { value: "MoMo", label: "MoMo" },
  { value: "VNPay", label: "VNPay" },
  { value: "BankTransfer", label: "Bank Transfer" },
];

type FilterValues = {
  buyerSearch: string;
  orderId: string;
  enterpriseId: string;
  paymentMethod: string;
  fromDate: string;
  toDate: string;
};

type Props = {
  currentStatus: string;
  initialValues: FilterValues;
};

export default function OrderSearch({ currentStatus, initialValues }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(
    !!(
      initialValues.orderId ||
      initialValues.enterpriseId ||
      initialValues.fromDate ||
      initialValues.toDate ||
      initialValues.paymentMethod
    ),
  );
  const [paymentMethod, setPaymentMethod] = useState(
    initialValues.paymentMethod,
  );
  const [orderId, setOrderId] = useState(initialValues.orderId);
  const [enterpriseId, setEnterpriseId] = useState(initialValues.enterpriseId);
  const [fromDate, setFromDate] = useState(initialValues.fromDate);
  const [toDate, setToDate] = useState(initialValues.toDate);
  const [pmOpen, setPmOpen] = useState(false);
  const pmRef = useRef<HTMLDivElement>(null);

  const applyBuyerSearch = useCallback(
    (q: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (q) p.set("buyerSearch", q);
      else p.delete("buyerSearch");
      p.delete("cursor");
      startTransition(() => {
        router.replace(`/admin/orders?${p.toString()}`, { scroll: false });
      });
    },
    [searchParams, router],
  );

  const { value: buyerSearchValue, onChange: onBuyerSearchChange } =
    useAdminSearchInput(initialValues.buyerSearch, applyBuyerSearch);

  function applyAllFilters() {
    const p = new URLSearchParams();
    if (currentStatus && currentStatus !== "all")
      p.set("status", currentStatus);
    if (buyerSearchValue.trim()) p.set("buyerSearch", buyerSearchValue.trim());
    if (orderId.trim()) p.set("orderId", orderId.trim());
    if (enterpriseId.trim()) p.set("enterpriseId", enterpriseId.trim());
    if (paymentMethod) p.set("paymentMethod", paymentMethod);
    if (fromDate) p.set("fromDate", fromDate);
    if (toDate) p.set("toDate", toDate);
    startTransition(() => {
      router.replace(`/admin/orders?${p.toString()}`, { scroll: false });
    });
  }

  function clearAllFilters() {
    setOrderId("");
    setEnterpriseId("");
    setPaymentMethod("");
    setFromDate("");
    setToDate("");
    const p = new URLSearchParams();
    if (currentStatus && currentStatus !== "all")
      p.set("status", currentStatus);
    startTransition(() => {
      router.replace(`/admin/orders?${p.toString()}`, { scroll: false });
    });
  }

  const hasActiveFilters = !!(
    initialValues.orderId ||
    initialValues.enterpriseId ||
    initialValues.paymentMethod ||
    initialValues.fromDate ||
    initialValues.toDate
  );

  const selectedPmLabel =
    PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ??
    "All Methods";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      {/* Row 1: Buyer search + toggle advanced */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={buyerSearchValue}
            onChange={onBuyerSearchChange}
            placeholder="Search by buyer name, phone, or email"
            disabled={isPending}
            aria-label="Search buyer"
            className="w-full border-0 appearance-none placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 gap-2 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 ps-10 text-[13px] py-2.5 ring-slate-200 bg-white"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className={[
            "shrink-0 inline-flex items-center gap-2 px-3 py-2.5 text-[13px] rounded border transition-colors",
            showAdvanced
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            hasActiveFilters && !showAdvanced ? "ring-2 ring-sky-300" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="ml-0.5 w-2 h-2 rounded-full bg-sky-400 inline-block" />
          )}
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Order ID */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter order ID"
                disabled={isPending}
                className="w-full border-0 appearance-none placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 text-[13px] py-2.5 ring-slate-200 bg-white"
              />
            </div>

            {/* Enterprise ID */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                Enterprise ID
              </label>
              <input
                type="text"
                value={enterpriseId}
                onChange={(e) => setEnterpriseId(e.target.value)}
                placeholder="Enter enterprise ID"
                disabled={isPending}
                className="w-full border-0 appearance-none placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 text-[13px] py-2.5 ring-slate-200 bg-white"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                Payment Method
              </label>
              <div ref={pmRef} className="relative">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setPmOpen((v) => !v)}
                  className="relative w-full inline-flex items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] py-2.5 px-3 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200"
                >
                  <span className="truncate">{selectedPmLabel}</span>
                  <ChevronDown
                    className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                      pmOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {pmOpen && (
                  <div className="absolute left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.value);
                          setPmOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-slate-900 hover:bg-slate-50 ${
                          paymentMethod === m.value
                            ? "bg-slate-50 font-medium"
                            : ""
                        }`}
                      >
                        {m.label}
                        {paymentMethod === m.value && (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={isPending}
                max={toDate || undefined}
                className="w-full border-0 appearance-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 text-[13px] py-2.5 ring-slate-200 bg-white"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={isPending}
                min={fromDate || undefined}
                className="w-full border-0 appearance-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded px-3 text-slate-900 ring ring-inset focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 text-[13px] py-2.5 ring-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={applyAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-[13px] rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Filter className="w-3.5 h-3.5" />
              )}
              Apply Filters
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                disabled={isPending}
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-3 py-2 text-[13px] rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
