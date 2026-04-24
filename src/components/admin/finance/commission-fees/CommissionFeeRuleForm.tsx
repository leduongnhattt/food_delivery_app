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

export type CommissionFeeRuleFormValues = {
  ruleName: string;
  isGlobalRule: boolean;
  foodCategoryId: string;
  commissionPercent: string;
  isActive: boolean;
  customPeriod: boolean;
  effectiveFrom: string;
  effectiveTo: string;
};

export type FoodCategoryOption = { id: string; name: string };

type CommissionFeeRuleFormProps = {
  title: string;
  subtitle: string;
  submitLabel: string;
  cancelLabel?: string;
  initialGlobal?: boolean;
  lockGlobal?: boolean;
  allowGlobalToggle: boolean;
  categoryOptions: FoodCategoryOption[];
  defaultValues: Partial<CommissionFeeRuleFormValues> | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: (values: CommissionFeeRuleFormValues) => Promise<void>;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isISODateOnly(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function CommissionFeeRuleForm({
  title,
  subtitle,
  submitLabel,
  cancelLabel,
  initialGlobal,
  lockGlobal,
  allowGlobalToggle,
  categoryOptions,
  defaultValues,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
}: CommissionFeeRuleFormProps) {
  const { showToast } = useToast();
  const [ruleName, setRuleName] = useState("");
  const [isGlobalRule, setIsGlobalRule] = useState(Boolean(initialGlobal));
  const [foodCategoryId, setFoodCategoryId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [customPeriod, setCustomPeriod] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [openCategoryMenu, setOpenCategoryMenu] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!defaultValues) return;
    if (defaultValues.ruleName !== undefined) setRuleName(defaultValues.ruleName);
    if (defaultValues.isGlobalRule !== undefined) setIsGlobalRule(defaultValues.isGlobalRule);
    if (defaultValues.foodCategoryId !== undefined) setFoodCategoryId(defaultValues.foodCategoryId);
    if (defaultValues.commissionPercent !== undefined) {
      setCommissionPercent(defaultValues.commissionPercent);
    }
    if (typeof defaultValues.isActive === "boolean") setIsActive(defaultValues.isActive);
    if (defaultValues.customPeriod !== undefined) setCustomPeriod(defaultValues.customPeriod);
    if (defaultValues.effectiveFrom !== undefined) setEffectiveFrom(defaultValues.effectiveFrom);
    if (defaultValues.effectiveTo !== undefined) setEffectiveTo(defaultValues.effectiveTo ?? "");
  }, [defaultValues]);

  useEffect(() => {
    if (initialGlobal) setIsGlobalRule(true);
  }, [initialGlobal]);

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null;
      const clicked = !!(categoryMenuRef.current && t && categoryMenuRef.current.contains(t));
      if (!clicked) setOpenCategoryMenu(false);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") setOpenCategoryMenu(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const summary = useMemo(() => {
    const rate = commissionPercent.trim();
    const cat =
      categoryOptions.find((c) => c.id === foodCategoryId)?.name ?? "—";
    const global = lockGlobal || isGlobalRule;
    const today = todayDateString();
    const fromDisplay = customPeriod ? (effectiveFrom || "—") : today;
    const toDisplay = customPeriod ? (effectiveTo || "—") : addDays(today, 1);
    return {
      ruleName: ruleName.trim() || "—",
      category: global ? "Global default" : cat,
      commissionPercent: rate ? `${rate}%` : "—",
      effectiveFrom: fromDisplay,
      effectiveTo: toDisplay,
      status: isActive ? "Active" : "Pending",
    };
  }, [
    ruleName,
    lockGlobal,
    isGlobalRule,
    isActive,
    foodCategoryId,
    commissionPercent,
    customPeriod,
    effectiveFrom,
    effectiveTo,
    categoryOptions,
  ]);

  const categoryLabel = useMemo(() => {
    if (!foodCategoryId) return "Select category";
    return categoryOptions.find((c) => c.id === foodCategoryId)?.name ?? "Select category";
  }, [foodCategoryId, categoryOptions]);

  async function handleSubmit() {
    const global = lockGlobal || isGlobalRule;

    const name = ruleName.trim();
    if (!name) {
      showToast("Rule name is required.", "error");
      return;
    }
    if (!global && !foodCategoryId.trim()) {
      showToast("Food category is required.", "error");
      return;
    }

    const pctRaw = commissionPercent.trim().replace(",", ".");
    if (!pctRaw) {
      showToast("Commission percent is required.", "error");
      return;
    }
    const pct = Number(pctRaw);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      showToast("Commission percent must be between 0 and 100.", "error");
      return;
    }

    const today = todayDateString();
    const from = customPeriod ? effectiveFrom.trim() : today;
    const to = customPeriod ? effectiveTo.trim() : addDays(today, 1);

    if (!isISODateOnly(from)) {
      showToast("Start date is required.", "error");
      return;
    }
    if (from < today) {
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
      ruleName,
      isGlobalRule: global,
      foodCategoryId,
      commissionPercent,
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
                <FinanceFieldLabel required>Rule Name</FinanceFieldLabel>
                <input
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Spring Sale Commission Rate"
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
                      if (next) setFoodCategoryId("");
                    }}
                    disabled={isSubmitting || lockGlobal}
                    className="h-4 w-4 rounded border-slate-300 accent-[#2563FF]"
                  />
                  Global rule (default for all categories)
                </label>
              ) : null}

              {!isGlobalRule && !lockGlobal ? (
                <div className="space-y-2">
                  <FinanceFieldLabel required>Food Category</FinanceFieldLabel>
                  <div ref={categoryMenuRef} className="relative">
                    <button
                      type="button"
                      onMouseDown={(ev) => ev.stopPropagation()}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setOpenCategoryMenu((v) => !v);
                      }}
                      className={adminFilterMenuTriggerClass(openCategoryMenu)}
                      aria-label="Food Category"
                      aria-haspopup="menu"
                      aria-expanded={openCategoryMenu}
                      disabled={isSubmitting}
                    >
                      <span className="truncate">{categoryLabel}</span>
                      <ChevronDown
                        className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                          openCategoryMenu ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {openCategoryMenu ? (
                      <div
                        onClick={(ev) => ev.stopPropagation()}
                        className="absolute left-0 right-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCategoryMenu(false);
                            setFoodCategoryId("");
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                        >
                          <span>Select category</span>
                          {!foodCategoryId && <Check className="w-4 h-4 text-slate-700" />}
                        </button>
                        {categoryOptions.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setOpenCategoryMenu(false);
                              setFoodCategoryId(c.id);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                          >
                            <span className="truncate">{c.name}</span>
                            {foodCategoryId === c.id && (
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
                <FinanceFieldLabel required>Commission Percent</FinanceFieldLabel>
                <InlineNumberField
                  value={commissionPercent}
                  onChange={setCommissionPercent}
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
              />
            </div>
          </div>

          {/* (removed old conditional period card) */}

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
            { label: "RULE NAME", value: summary.ruleName },
            { label: "CATEGORY", value: summary.category },
            { label: "COMMISSION PERCENT", value: summary.commissionPercent },
            { label: "EFFECTIVE FROM", value: summary.effectiveFrom },
            { label: "EFFECTIVE TO", value: summary.effectiveTo },
            { label: "STATUS", value: summary.status },
          ]}
        />
      </div>
    </div>
  );
}
