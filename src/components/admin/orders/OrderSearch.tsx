"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { useAdminSearchInput } from "@/hooks/admin-hooks";
import { DateTimePickerField } from "@/components/ui/date-time-picker";
import {
  DropdownSelect,
  type DropdownSelectOption,
} from "@/components/ui/dropdown-select";

const PAYMENT_METHODS = [
  { value: "", label: "All Methods" },
  { value: "Cash", label: "Cash" },
  { value: "CreditCard", label: "Credit Card" },
  { value: "MoMo", label: "MoMo" },
  { value: "VNPay", label: "VNPay" },
  { value: "BankTransfer", label: "Bank Transfer" },
];

const PAYMENT_STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Completed", label: "Completed" },
  { value: "Failed", label: "Failed" },
];

type FilterValues = {
  q: string;
  paymentMethod: string;
  paymentStatus: string;
  fromDate: string;
  toDate: string;
};

type Props = {
  currentStatus: string;
  initialValues: FilterValues;
  statusControl?: React.ReactNode;
  /** Called before navigating to a clean `/admin/orders` URL (e.g. clear cursor stack in session). */
  onResetAllFilters?: () => void;
};

export default function OrderSearch({
  currentStatus,
  initialValues,
  statusControl,
  onResetAllFilters,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const restoreSearchFocusRef = useRef(false);
  const [paymentMethod, setPaymentMethod] = useState(
    initialValues.paymentMethod,
  );
  const [paymentStatus, setPaymentStatus] = useState(
    initialValues.paymentStatus,
  );
  const [fromDate, setFromDate] = useState(initialValues.fromDate);
  const [toDate, setToDate] = useState(initialValues.toDate);
  /** When the URL query changes (reset, back/forward, debounced updates), align local filter state — not on every parent re-render. */
  useEffect(() => {
    setPaymentMethod(initialValues.paymentMethod);
    setPaymentStatus(initialValues.paymentStatus);
    setFromDate(initialValues.fromDate);
    setToDate(initialValues.toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: `initialValues` is a new object each render from parent
  }, [searchParams.toString()]);
  const [isPaymentMethodMenuOpen, setIsPaymentMethodMenuOpen] = useState(false);
  const paymentMethodMenuRef = useRef<HTMLDivElement>(null);
  const [isPaymentStatusMenuOpen, setIsPaymentStatusMenuOpen] = useState(false);
  const paymentStatusMenuRef = useRef<HTMLDivElement>(null);

  const qModeParam = searchParams.get("qMode") || "buyer";
  const [qMode, setQModeState] = useState(qModeParam);
  useEffect(() => {
    setQModeState(qModeParam);
  }, [qModeParam]);

  const searchModeOptions = useMemo<DropdownSelectOption[]>(
    () => [
      { value: "buyer", label: "Name" },
      { value: "orderId", label: "Order ID" },
    ],
    [],
  );

  const updateUrlFilters = useCallback(
    (next: FilterValues & { qMode: string }) => {
      const normalized = {
        ...next,
        q: next.q.trim(),
      };

      const params = new URLSearchParams();
      if (currentStatus && currentStatus !== "all") params.set("status", currentStatus);

      if (normalized.q && !normalized.q.includes("@")) params.set("q", normalized.q);
      if (normalized.qMode && normalized.qMode !== "buyer") params.set("qMode", normalized.qMode);

      if (normalized.paymentMethod) params.set("paymentMethod", normalized.paymentMethod);
      if (normalized.paymentStatus) params.set("paymentStatus", normalized.paymentStatus);
      if (normalized.fromDate) params.set("fromDate", normalized.fromDate);
      if (normalized.toDate) params.set("toDate", normalized.toDate);

      // Reset cursor when any filter changes
      params.delete("cursor");

      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `/admin/orders?${qs}` : "/admin/orders", { scroll: false });
      });
    },
    [currentStatus, router, startTransition],
  );

  const applyQ = useCallback(
    (nextQ: string) => {
      updateUrlFilters({
        q: nextQ,
        qMode,
        paymentMethod,
        paymentStatus,
        fromDate,
        toDate,
      });
    },
    [fromDate, paymentMethod, paymentStatus, qMode, toDate, updateUrlFilters],
  );

  const { value: qValue, onChange: onQChange } = useAdminSearchInput(
    initialValues.q,
    applyQ,
  );

  // If we update the URL while typing, Next navigation can re-render and drop focus.
  // Restore focus after the transition completes, but only when the user was typing.
  useEffect(() => {
    if (isPending) return;
    if (!restoreSearchFocusRef.current) return;
    restoreSearchFocusRef.current = false;
    const el = searchInputRef.current;
    if (!el) return;
    if (typeof document !== "undefined" && document.activeElement === el) return;
    requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
    });
  }, [isPending]);

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null;
      if (
        isPaymentMethodMenuOpen &&
        paymentMethodMenuRef.current &&
        t &&
        !paymentMethodMenuRef.current.contains(t)
      ) {
        setIsPaymentMethodMenuOpen(false);
      }
      if (
        isPaymentStatusMenuOpen &&
        paymentStatusMenuRef.current &&
        t &&
        !paymentStatusMenuRef.current.contains(t)
      ) {
        setIsPaymentStatusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [isPaymentMethodMenuOpen, isPaymentStatusMenuOpen]);

  const setQMode = useCallback(
    (next: string) => {
      // Only change UI when user hasn't typed a query yet.
      setQModeState(next);

      const trimmed = qValue.trim();
      if (!trimmed || trimmed.includes("@")) return;
      updateUrlFilters({
        q: trimmed,
        qMode: next,
        paymentMethod,
        paymentStatus,
        fromDate,
        toDate,
      });
    },
    [fromDate, paymentMethod, paymentStatus, qValue, toDate, updateUrlFilters],
  );

  function clearAllFilters() {
    setPaymentMethod("");
    setPaymentStatus("");
    setFromDate("");
    setToDate("");
    setQModeState("buyer");
    setIsPaymentMethodMenuOpen(false);
    setIsPaymentStatusMenuOpen(false);
    onResetAllFilters?.();
    startTransition(() => {
      router.replace("/admin/orders", { scroll: false });
    });
  }

  const hasActiveFilters =
    !!qValue.trim() ||
    currentStatus !== "all" ||
    !!paymentMethod ||
    !!paymentStatus ||
    !!fromDate ||
    !!toDate;

  const selectedPmLabel =
    PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ??
    "All Methods";

  const selectedPsLabel =
    PAYMENT_STATUSES.find((s) => s.value === paymentStatus)?.label ??
    "All Statuses";

  // Keep URL in sync while editing filters (no Apply button).
  useEffect(() => {
    const t = setTimeout(() => {
      updateUrlFilters({
        q: qValue,
        qMode,
        paymentMethod,
        paymentStatus,
        fromDate,
        toDate,
      });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMethod, paymentStatus, fromDate, toDate]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      {/* Row 1: Buyer search + status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
        <div className="w-full min-w-0 sm:col-span-9">
          <div className="flex min-w-0 flex-1 items-stretch rounded border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-sky-300">
            <DropdownSelect
              value={qMode}
              onChange={setQMode}
              options={searchModeOptions}
              className="w-40 shrink-0"
              borderlessTrigger
              triggerClassName="h-8 min-h-8 rounded-none rounded-l-md rounded-r-none"
              aria-label="Search by field"
            />
            <div className="relative min-w-0 flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                value={qValue}
                onChange={(e) => {
                  restoreSearchFocusRef.current = true;
                  onQChange(e);
                }}
                placeholder={
                  qMode === "orderId"
                    ? "Last 5 characters shown in the list (or full order ID)"
                    : "Input buyer or seller name"
                }
                disabled={isPending}
                aria-label="Search"
                className="h-8 min-h-8 min-w-0 w-full rounded-none rounded-r-md border-0 border-l border-slate-200 bg-white px-3 ps-10 text-[13px] leading-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-75"
              />
            </div>
          </div>
        </div>

        <div className="w-full min-w-0 sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
            Order status
          </label>
          <div className="w-full min-w-0">{statusControl ? statusControl : null}</div>
        </div>
      </div>

      {/* Filters (always visible; no Apply button) */}
      <div className="border-t border-slate-100 pt-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Payment Method */}
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
              Payment Method
            </label>
            <div ref={paymentMethodMenuRef} className="relative">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsPaymentMethodMenuOpen((v) => !v)}
                className="relative w-full inline-flex h-8 min-h-8 items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] px-3 py-0 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200"
              >
                <span className="truncate">{selectedPmLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    isPaymentMethodMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isPaymentMethodMenuOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(m.value);
                        setIsPaymentMethodMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-slate-900 hover:bg-slate-50 ${
                        paymentMethod === m.value ? "bg-slate-50 font-medium" : ""
                      }`}
                    >
                      {m.label}
                      {paymentMethod === m.value ? (
                        <Check className="w-4 h-4 text-slate-700" />
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pay Status */}
          <div className="min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
              Pay status
            </label>
            <div ref={paymentStatusMenuRef} className="relative">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsPaymentStatusMenuOpen((v) => !v)}
                className="relative w-full inline-flex h-8 min-h-8 items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors rounded gap-2 text-[13px] px-3 py-0 text-slate-900 bg-white ring ring-inset hover:bg-slate-50 focus:ring-2 focus:ring-inset focus:ring-sky-300 pe-10 ring-slate-200"
              >
                <span className="truncate">{selectedPsLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    isPaymentStatusMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isPaymentStatusMenuOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
                  {PAYMENT_STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => {
                        setPaymentStatus(s.value);
                        setIsPaymentStatusMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-[13px] text-slate-900 hover:bg-slate-50 ${
                        paymentStatus === s.value ? "bg-slate-50 font-medium" : ""
                      }`}
                    >
                      {s.label}
                      {paymentStatus === s.value ? (
                        <Check className="w-4 h-4 text-slate-700" />
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
              From Date
            </label>
            <DateTimePickerField
              mode="date"
              value={fromDate}
              onChange={(next) => setFromDate(next)}
              disabled={isPending}
              max={toDate || undefined}
              placeholder="dd/mm/yyyy"
              triggerClassName="w-full h-8 min-h-8 border-0 bg-white py-0 ps-3 pe-9 text-[13px] leading-normal text-slate-900 ring ring-inset ring-slate-200 rounded transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-75"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">
              To Date
            </label>
            <DateTimePickerField
              mode="date"
              value={toDate}
              onChange={(next) => setToDate(next)}
              disabled={isPending}
              min={fromDate || undefined}
              placeholder="dd/mm/yyyy"
              triggerClassName="w-full h-8 min-h-8 border-0 bg-white py-0 ps-3 pe-9 text-[13px] leading-normal text-slate-900 ring ring-inset ring-slate-200 rounded transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-75"
            />
          </div>
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                clearAllFilters();
              }}
              className="inline-flex h-8 min-h-8 items-center gap-2 px-3 py-0 text-[13px] rounded border border-sky-600 bg-white text-sky-600 hover:bg-sky-600 hover:text-white disabled:opacity-60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
