"use client";

import type React from "react";
import { Info } from "lucide-react";
import { DateTimePickerField } from "@/components/ui/date-time-picker";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { ADMIN_FIELD_BASE_CLASS } from "@/components/admin/shared/admin-field-classes";

export function FinanceCardTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <span className="text-slate-500">{icon}</span>
      <div className="text-[12px] font-semibold text-slate-700">{children}</div>
    </div>
  );
}

export function FinanceFieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="text-[12px] font-medium text-slate-600">
      {children}
      {required ? <span className="text-rose-600"> *</span> : null}
    </div>
  );
}

export function InlineNumberField({
  value,
  onChange,
  suffix,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex h-8 w-[120px] overflow-hidden rounded border border-slate-200 bg-white">
      <input
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-8 w-full border-0 bg-white px-3 text-[12px] text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-75"
      />
      <div className="flex h-8 w-10 items-center justify-center border-l border-slate-200 bg-slate-50 text-[12px] font-medium text-slate-600">
        {suffix}
      </div>
    </div>
  );
}

export function FinanceCreateActions({
  cancelLabel,
  createLabel,
  onCancel,
  onCreate,
  submitDisabled,
  cancelDisabled,
}: {
  cancelLabel?: string;
  createLabel: string;
  onCancel: () => void;
  onCreate?: () => void;
  submitDisabled?: boolean;
  cancelDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-1">
      <button
        type="button"
        onClick={onCancel}
        disabled={cancelDisabled}
        className="inline-flex h-8 min-h-8 min-w-[110px] items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-[12px] font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cancelLabel ?? "Cancel"}
      </button>
      <button
        type="button"
        onClick={onCreate}
        disabled={submitDisabled}
        className="inline-flex h-8 min-h-8 min-w-[110px] items-center justify-center rounded-md border border-[#2563FF] bg-[#2563FF] px-4 text-[12px] font-medium text-white hover:bg-[#1E4FE6] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {createLabel}
      </button>
    </div>
  );
}

export function FinanceSummaryCard({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="px-4 py-3">
        <div className="text-[12px] font-semibold text-slate-700">Summary</div>
      </div>
      <div className="border-t border-slate-100 px-4 py-3 space-y-4">
        {items.map((it) => (
          <div key={it.label}>
            <div className="text-[10px] font-semibold tracking-wide text-slate-400">
              {it.label}
            </div>
            <div className="mt-1 text-[12px] font-medium text-slate-700">{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FinancePeriodFields({
  customPeriod,
  setCustomPeriod,
  effectiveFrom,
  setEffectiveFrom,
  effectiveTo,
  setEffectiveTo,
  emptyHint,
}: {
  customPeriod: boolean;
  setCustomPeriod: (next: boolean) => void;
  effectiveFrom: string;
  setEffectiveFrom: (next: string) => void;
  effectiveTo: string;
  setEffectiveTo: (next: string) => void;
  emptyHint?: string;
}) {
  const todayMin = new Date().toISOString().slice(0, 10);
  const endMin = effectiveFrom && /^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)
    ? effectiveFrom < todayMin
      ? todayMin
      : effectiveFrom
    : todayMin;

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-[12px] text-slate-700">
        <input
          type="checkbox"
          checked={customPeriod}
          onChange={(e) => setCustomPeriod(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-[#2563FF]"
        />
        Set Custom Period
      </label>

      {customPeriod ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="text-[12px] font-medium text-slate-600">
                Start Date <span className="text-rose-600"> *</span>
              </div>
              <HelpTooltip text="Can be today or a future date" />
            </div>
            <DateTimePickerField
              value={effectiveFrom}
              onChange={setEffectiveFrom}
              mode="date"
              min={todayMin}
              align="start"
              triggerClassName={ADMIN_FIELD_BASE_CLASS}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="text-[12px] font-medium text-slate-600">
                End Date{" "}
                <span className="text-[11px] font-normal text-slate-400">
                  (Optional)
                </span>
              </div>
              <HelpTooltip text="Leave empty for indefinite period" />
            </div>
            <DateTimePickerField
              value={effectiveTo}
              onChange={setEffectiveTo}
              mode="date"
              min={endMin}
              align="start"
              triggerClassName={ADMIN_FIELD_BASE_CLASS}
            />
          </div>
        </div>
      ) : (
        emptyHint ? (
          <div className="rounded border border-blue-100 bg-blue-50 px-3 py-2 text-[12px] text-slate-600">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 text-blue-500" aria-hidden="true" />
              <div>{emptyHint}</div>
            </div>
          </div>
        ) : null
      )}
    </div>
  );
}

