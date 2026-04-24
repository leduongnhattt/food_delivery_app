"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, FileText } from "lucide-react";
import { ADMIN_FIELD_BASE_CLASS } from "@/components/admin/shared/admin-field-classes";
import {
  FinanceCardTitle,
  FinanceCreateActions,
  FinanceFieldLabel,
  FinancePeriodFields,
  FinanceSummaryCard,
  InlineNumberField,
} from "@/components/admin/shared/finance-create-ui";
import { TRANSACTION_FEE_PAYMENT_CHANNELS } from "@/lib/transaction-fee-channels";

export type TransactionFeeRuleFormValues = {
  feeName: string;
  /** `postValue` from TRANSACTION_FEE_PAYMENT_CHANNELS; ignored when variant is global. */
  paymentChannelPostValue: string;
  ratePercent: string;
  isActive: boolean;
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
  defaultValues: Partial<TransactionFeeRuleFormValues> | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (values: TransactionFeeRuleFormValues) => Promise<void>;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionFeeRuleForm({
  variant,
  title,
  subtitle,
  submitLabel,
  cancelLabel,
  defaultValues,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}: TransactionFeeRuleFormProps) {
  const [feeName, setFeeName] = useState("");
  const [paymentChannelPostValue, setPaymentChannelPostValue] = useState("");
  const [ratePercent, setRatePercent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [customPeriod, setCustomPeriod] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  useEffect(() => {
    if (!defaultValues) return;
    if (defaultValues.feeName !== undefined) setFeeName(defaultValues.feeName);
    if (defaultValues.paymentChannelPostValue !== undefined) {
      setPaymentChannelPostValue(defaultValues.paymentChannelPostValue);
    }
    if (defaultValues.ratePercent !== undefined) setRatePercent(defaultValues.ratePercent);
    if (defaultValues.isActive !== undefined) setIsActive(defaultValues.isActive);
    if (defaultValues.customPeriod !== undefined) setCustomPeriod(defaultValues.customPeriod);
    if (defaultValues.effectiveFrom !== undefined) setEffectiveFrom(defaultValues.effectiveFrom);
    if (defaultValues.effectiveTo !== undefined) setEffectiveTo(defaultValues.effectiveTo ?? "");
  }, [defaultValues]);

  const summary = useMemo(() => {
    const rate = ratePercent.trim();
    const ch =
      TRANSACTION_FEE_PAYMENT_CHANNELS.find((c) => c.postValue === paymentChannelPostValue)
        ?.label ?? "—";
    const period =
      variant === "global"
        ? customPeriod
          ? "Custom"
          : "Indefinite (global dates below)"
        : customPeriod
          ? "Custom"
          : "Indefinite";
    return {
      feeName: feeName.trim() || "—",
      paymentChannel: variant === "global" ? "Global default" : ch,
      rate: rate ? `${rate}%` : "—",
      period,
      active: isActive ? "Active" : "Inactive",
    };
  }, [feeName, variant, paymentChannelPostValue, ratePercent, customPeriod, isActive]);

  async function handleSubmit() {
    const global = variant === "global";
    await onSubmit({
      feeName,
      paymentChannelPostValue: global ? "" : paymentChannelPostValue,
      ratePercent,
      isActive,
      customPeriod,
      effectiveFrom: global
        ? customPeriod
          ? effectiveFrom
          : todayDateString()
        : customPeriod
          ? effectiveFrom
          : todayDateString(),
      effectiveTo: global
        ? customPeriod
          ? effectiveTo
          : ""
        : customPeriod
          ? effectiveTo
          : "",
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

              {variant === "channel" ? (
                <div className="space-y-2">
                  <FinanceFieldLabel required>Payment Channel</FinanceFieldLabel>
                  <select
                    value={paymentChannelPostValue}
                    onChange={(e) => setPaymentChannelPostValue(e.target.value)}
                    className={ADMIN_FIELD_BASE_CLASS}
                    aria-label="Select payment channel"
                    disabled={isSubmitting}
                  >
                    <option value="">Select payment channel</option>
                    {TRANSACTION_FEE_PAYMENT_CHANNELS.map((c) => (
                      <option key={c.filterId} value={c.postValue}>
                        {c.label}
                      </option>
                    ))}
                  </select>
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

              <label className="flex items-center gap-2 text-[12px] text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-slate-300 accent-[#2563FF]"
                />
                Rule is active
              </label>
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
                emptyHint={
                  variant === "global"
                    ? "When off, effective-from defaults to today on save (end optional)."
                    : "This fee has no custom period and will remain active indefinitely."
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
            { label: "STATUS", value: summary.active },
          ]}
        />
      </div>
    </div>
  );
}
