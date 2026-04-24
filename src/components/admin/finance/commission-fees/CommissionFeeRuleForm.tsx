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

export type CommissionFeeRuleFormValues = {
  ruleName: string;
  isGlobalRule: boolean;
  foodCategoryId: string;
  commissionPercent: string;
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
  /** When set, initializes global checkbox (create flow). */
  initialGlobal?: boolean;
  /** When true, global checkbox stays on (create global from card). */
  lockGlobal?: boolean;
  /** When false, category-only (edit); hides global toggle. */
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
  const [ruleName, setRuleName] = useState("");
  const [isGlobalRule, setIsGlobalRule] = useState(Boolean(initialGlobal));
  const [foodCategoryId, setFoodCategoryId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [customPeriod, setCustomPeriod] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  useEffect(() => {
    if (!defaultValues) return;
    if (defaultValues.ruleName !== undefined) setRuleName(defaultValues.ruleName);
    if (defaultValues.isGlobalRule !== undefined) setIsGlobalRule(defaultValues.isGlobalRule);
    if (defaultValues.foodCategoryId !== undefined) setFoodCategoryId(defaultValues.foodCategoryId);
    if (defaultValues.commissionPercent !== undefined) {
      setCommissionPercent(defaultValues.commissionPercent);
    }
    if (defaultValues.customPeriod !== undefined) setCustomPeriod(defaultValues.customPeriod);
    if (defaultValues.effectiveFrom !== undefined) setEffectiveFrom(defaultValues.effectiveFrom);
    if (defaultValues.effectiveTo !== undefined) setEffectiveTo(defaultValues.effectiveTo ?? "");
  }, [defaultValues]);

  useEffect(() => {
    if (initialGlobal) setIsGlobalRule(true);
  }, [initialGlobal]);

  const summary = useMemo(() => {
    const rate = commissionPercent.trim();
    const cat =
      categoryOptions.find((c) => c.id === foodCategoryId)?.name ?? "—";
    const global = lockGlobal || isGlobalRule;
    return {
      ruleName: ruleName.trim() || "—",
      category: global ? "Global default" : cat,
      commissionPercent: rate ? `${rate}%` : "—",
      effectiveFrom: global ? "—" : effectiveFrom || "—",
      effectiveTo: global ? "—" : effectiveTo || "—",
    };
  }, [
    ruleName,
    lockGlobal,
    isGlobalRule,
    foodCategoryId,
    commissionPercent,
    effectiveFrom,
    effectiveTo,
    categoryOptions,
  ]);

  async function handleSubmit() {
    const global = lockGlobal || isGlobalRule;
    await onSubmit({
      ruleName,
      isGlobalRule: global,
      foodCategoryId,
      commissionPercent,
      customPeriod,
      effectiveFrom: global
        ? ""
        : customPeriod
          ? effectiveFrom
          : todayDateString(),
      effectiveTo: global ? "" : customPeriod ? effectiveTo : "",
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
                  <select
                    value={foodCategoryId}
                    onChange={(e) => setFoodCategoryId(e.target.value)}
                    className={ADMIN_FIELD_BASE_CLASS}
                    aria-label="Food category"
                    disabled={isSubmitting}
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
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

          {!isGlobalRule && !lockGlobal ? (
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
                  emptyHint="This rule has no custom period and will remain active indefinitely."
                />
              </div>
            </div>
          ) : null}

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
          ]}
        />
      </div>
    </div>
  );
}
