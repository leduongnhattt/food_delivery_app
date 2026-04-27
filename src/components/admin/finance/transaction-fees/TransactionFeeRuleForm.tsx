"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, FileText } from "lucide-react";
import { ADMIN_FIELD_BASE_CLASS } from "@/components/admin/shared/admin-field-classes";
import { adminFilterMenuTriggerClass } from "@/components/admin/shared/admin-filter-trigger";
import { useToast } from "@/contexts/toast-context";
import {
  FinanceCardTitle,
  FinanceCreateActions,
  FinanceFieldLabel,
  FinancePeriodFields,
  FinanceSummaryCard,
  InlineNumberField,
} from "@/components/admin/shared/finance-create-ui";
import {
  addDays,
  formatDateDdMmYyyy,
  isISODateOnly,
  todayDateString,
} from "@/lib/utils";
import { TRANSACTION_FEE_PAYMENT_CHANNELS } from "@/lib/transaction-fee-channels";

export type TransactionFeeRuleFormValues = {
  feeName: string;
  isGlobalRule: boolean;
  paymentChannelPostValue: string;
  ratePercent: string;
  isActive: boolean;
  activatedAt?: string | null;
  expiredAt?: string | null;
  customPeriod: boolean;
  effectiveFrom: string;
  effectiveTo: string;
};

export type TransactionFeeRuleFormVariant = "global" | "channel";

type TransactionFeeRuleFormProps = {
  variant: TransactionFeeRuleFormVariant;
  title: string;
  subtitle: string;
  submitLabel: string;
  cancelLabel?: string;
  initialGlobal?: boolean;
  lockGlobal?: boolean;
  allowGlobalToggle?: boolean;
  defaultValues: Partial<TransactionFeeRuleFormValues> | null;
  lockCustomPeriod?: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (values: TransactionFeeRuleFormValues) => Promise<void>;
};

export function TransactionFeeRuleForm({
  variant,
  title,
  subtitle,
  submitLabel,
  cancelLabel,
  initialGlobal,
  lockGlobal,
  allowGlobalToggle,
  defaultValues,
  lockCustomPeriod,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}: TransactionFeeRuleFormProps) {
  const { showToast } = useToast();
  const [feeName, setFeeName] = useState("");
  const [isGlobalRule, setIsGlobalRule] = useState(Boolean(initialGlobal));
  const [paymentChannelPostValue, setPaymentChannelPostValue] = useState("");
  const [ratePercent, setRatePercent] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [customPeriod, setCustomPeriod] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [openPaymentMenu, setOpenPaymentMenu] = useState(false);
  const paymentMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!defaultValues) return;
    if (defaultValues.feeName !== undefined) setFeeName(defaultValues.feeName);
    if (defaultValues.isGlobalRule !== undefined) setIsGlobalRule(defaultValues.isGlobalRule);
    if (defaultValues.paymentChannelPostValue !== undefined) {
      setPaymentChannelPostValue(defaultValues.paymentChannelPostValue);
    }
    if (defaultValues.ratePercent !== undefined) setRatePercent(defaultValues.ratePercent);
    if (defaultValues.isActive !== undefined) setIsActive(defaultValues.isActive);
    if (defaultValues.customPeriod !== undefined) setCustomPeriod(defaultValues.customPeriod);
    if (defaultValues.effectiveFrom !== undefined) setEffectiveFrom(defaultValues.effectiveFrom);
    if (defaultValues.effectiveTo !== undefined) setEffectiveTo(defaultValues.effectiveTo ?? "");
  }, [defaultValues]);

  const lockPeriod = (lockCustomPeriod ?? false) || !!defaultValues;

  useEffect(() => {
    if (!lockPeriod) return;
    setCustomPeriod(true);
  }, [lockPeriod]);

  useEffect(() => {
    if (initialGlobal) setIsGlobalRule(true);
  }, [initialGlobal]);

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null;
      const clicked = !!(paymentMenuRef.current && t && paymentMenuRef.current.contains(t));
      if (!clicked) setOpenPaymentMenu(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpenPaymentMenu(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const summary = useMemo(() => {
    const rate = ratePercent.trim();
    const channelLabel =
      TRANSACTION_FEE_PAYMENT_CHANNELS.find((c) => c.postValue === paymentChannelPostValue)?.label ??
      "—";
    const period =
      (lockGlobal || isGlobalRule || variant === "global")
        ? customPeriod
          ? "Custom"
          : "Indefinite (global dates below)"
        : customPeriod
          ? "Custom"
          : "Indefinite";
    const global = lockGlobal || isGlobalRule || variant === "global";
    const today = todayDateString();
    const fromRaw = customPeriod ? (effectiveFrom || "—") : today;
    const toRaw = customPeriod ? (effectiveTo || "—") : addDays(today, 1);
    return {
      feeName: feeName.trim() || "—",
      paymentChannel: global ? "Global default" : channelLabel,
      rate: rate ? `${rate}%` : "—",
      period,
      effectiveFrom: fromRaw === "—" ? "—" : formatDateDdMmYyyy(fromRaw),
      effectiveTo: toRaw === "—" ? "—" : formatDateDdMmYyyy(toRaw),
      status: isActive ? "Active" : "Pending",
    };
  }, [
    feeName,
    variant,
    lockGlobal,
    isGlobalRule,
    paymentChannelPostValue,
    ratePercent,
    customPeriod,
    isActive,
    effectiveFrom,
    effectiveTo,
  ]);

  const paymentLabel = useMemo(() => {
    if (!paymentChannelPostValue) return "Select payment channel";
    return (
      TRANSACTION_FEE_PAYMENT_CHANNELS.find((c) => c.postValue === paymentChannelPostValue)
        ?.label ?? "Select payment channel"
    );
  }, [paymentChannelPostValue]);

  async function handleSubmit() {
    const global = lockGlobal || isGlobalRule || variant === "global";

    const trimmedFeeName = feeName.trim();
    if (!trimmedFeeName) {
      showToast("Fee name is required.", "error");
      return;
    }

    if (!global && !paymentChannelPostValue.trim()) {
      showToast("Payment channel is required.", "error");
      return;
    }

    const percentInput = ratePercent.trim().replace(",", ".");
    if (!percentInput) {
      showToast("Transaction fee rate is required.", "error");
      return;
    }
    const percentValue = Number(percentInput);
    if (!Number.isFinite(percentValue) || percentValue < 0 || percentValue > 100) {
      showToast("Transaction fee rate must be between 0 and 100.", "error");
      return;
    }

    const today = todayDateString();
    const from = customPeriod ? effectiveFrom.trim() : today;
    const to = customPeriod ? effectiveTo.trim() : addDays(today, 1);

    if (!isISODateOnly(from)) {
      showToast("Start date is required.", "error");
      return;
    }
    const existingFrom = defaultValues?.effectiveFrom;
    const allowPastExistingStart =
      !!existingFrom && isISODateOnly(existingFrom) && existingFrom === from && from < today;
    if (from < today && !allowPastExistingStart) {
      showToast("Start date cannot be in the past.", "error");
      return;
    }
    if (to) {
      if (!isISODateOnly(to)) {
        showToast("End date is invalid.", "error");
        return;
      }
      if (to < from) {
        showToast("Start date cannot be after end date.", "error");
        return;
      }
    }

    await onSubmit({
      feeName,
      isGlobalRule: global,
      paymentChannelPostValue: global ? "" : paymentChannelPostValue,
      ratePercent,
      isActive,
      customPeriod,
      effectiveFrom: from,
      effectiveTo: to,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
          {title}
        </h1>
        <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
          {subtitle}
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white">
            <FinanceCardTitle icon={<FileText className="h-4 w-4 text-[#2563FF]" />}>
              Basic Information
            </FinanceCardTitle>
            <div className="border-t border-slate-100 px-4 py-3 space-y-4">
              <div className="space-y-2">
                <FinanceFieldLabel required>Fee Name</FinanceFieldLabel>
                <input
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  placeholder="Enter fee name"
                  className={ADMIN_FIELD_BASE_CLASS}
                  disabled={isSubmitting}
                />
              </div>

              {allowGlobalToggle ? (
                <label className="flex items-center gap-2 text-[12px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={lockGlobal ? true : isGlobalRule}
                    onChange={(e) => {
                      if (lockGlobal) return;
                      const next = e.target.checked;
                      setIsGlobalRule(next);
                      if (next) setPaymentChannelPostValue("");
                    }}
                    disabled={isSubmitting || lockGlobal}
                    className="h-4 w-4 rounded border-slate-300 accent-[#2563FF]"
                  />
                  Global rule (default for all payments)
                </label>
              ) : null}

              {!isGlobalRule && variant === "channel" ? (
                <div className="space-y-2">
                  <FinanceFieldLabel required>Payment Channel</FinanceFieldLabel>
                  <div ref={paymentMenuRef} className="relative">
                    <button
                      type="button"
                      onMouseDown={(ev) => ev.stopPropagation()}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setOpenPaymentMenu((v) => !v);
                      }}
                      className={adminFilterMenuTriggerClass(openPaymentMenu)}
                      aria-label="Payment Channel"
                      aria-haspopup="menu"
                      aria-expanded={openPaymentMenu}
                      disabled={isSubmitting}
                    >
                      <span className="truncate">{paymentLabel}</span>
                      <ChevronDown
                        className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                          openPaymentMenu ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openPaymentMenu ? (
                      <div
                        onClick={(ev) => ev.stopPropagation()}
                        className="absolute left-0 right-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenPaymentMenu(false);
                            setPaymentChannelPostValue("");
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                        >
                          <span>Select payment channel</span>
                          {!paymentChannelPostValue && (
                            <Check className="w-4 h-4 text-slate-700" />
                          )}
                        </button>
                        {TRANSACTION_FEE_PAYMENT_CHANNELS.map((c) => (
                          <button
                            key={c.filterId}
                            type="button"
                            onClick={() => {
                              setOpenPaymentMenu(false);
                              setPaymentChannelPostValue(c.postValue);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                          >
                            <span className="truncate">{c.label}</span>
                            {paymentChannelPostValue === c.postValue && (
                              <Check className="w-4 h-4 shrink-0 text-slate-700" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <FinanceFieldLabel required>Transaction Fee Rate</FinanceFieldLabel>
                <InlineNumberField
                  value={ratePercent}
                  onChange={setRatePercent}
                  suffix="%"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>

            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white">
            <FinanceCardTitle icon={<CalendarDays className="h-4 w-4" />}>Period</FinanceCardTitle>
            <div className="border-t border-slate-100 px-4 py-3">
              <FinancePeriodFields
                customPeriod={customPeriod}
                setCustomPeriod={setCustomPeriod}
                effectiveFrom={effectiveFrom}
                setEffectiveFrom={setEffectiveFrom}
                effectiveTo={effectiveTo}
                setEffectiveTo={setEffectiveTo}
                lockCustomPeriod={lockPeriod}
                allowPastStartOnEdit={
                  !!defaultValues?.effectiveFrom &&
                  isISODateOnly(defaultValues.effectiveFrom) &&
                  defaultValues.effectiveFrom < todayDateString()
                }
              />
            </div>
          </div>

          <FinanceCreateActions
            createLabel={submitLabel}
            cancelLabel={cancelLabel}
            onCancel={onCancel}
            onCreate={() => void handleSubmit()}
            submitDisabled={isSubmitting}
            cancelDisabled={isSubmitting}
          />
        </div>

        <FinanceSummaryCard
          items={[
            { label: "FEE NAME", value: summary.feeName },
            { label: "PAYMENT CHANNEL", value: summary.paymentChannel },
            { label: "TRANSACTION FEE RATE", value: summary.rate },
            { label: "PERIOD", value: summary.period },
            { label: "EFFECTIVE FROM", value: summary.effectiveFrom },
            { label: "EFFECTIVE TO", value: summary.effectiveTo },
            { label: "STATUS", value: summary.status },
          ]}
        />
      </div>
    </div>
  );
}
