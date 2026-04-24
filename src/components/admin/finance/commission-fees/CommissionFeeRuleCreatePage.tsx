"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type FoodCategoryOption = { id: string; name: string };

const MOCK_CATEGORIES: FoodCategoryOption[] = [
  { id: "cat-burgers", name: "Burgers" },
  { id: "cat-pizza", name: "Pizza" },
  { id: "cat-drinks", name: "Drinks" },
  { id: "cat-sushi", name: "Sushi" },
];

export function CommissionFeeRuleCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGlobal = searchParams.get("scope") === "global";
  const [ruleName, setRuleName] = useState("");
  const [isGlobalRule, setIsGlobalRule] = useState(initialGlobal);
  const [foodCategoryId, setFoodCategoryId] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [customPeriod, setCustomPeriod] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  const summary = useMemo(() => {
    const rate = commissionPercent.trim();
    const cat =
      MOCK_CATEGORIES.find((c) => c.id === foodCategoryId)?.name || "—";
    return {
      ruleName: ruleName.trim() || "—",
      category: isGlobalRule ? "Global default" : cat,
      commissionPercent: rate ? `${rate}%` : "—",
      effectiveFrom: effectiveFrom || "—",
      effectiveTo: effectiveTo || "—",
    };
  }, [
    ruleName,
    isGlobalRule,
    foodCategoryId,
    commissionPercent,
    effectiveFrom,
    effectiveTo,
  ]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
          Create New Commission Rule
        </h1>
        <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
          Set up a new commission fee rule for food categories.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Left form */}
        <div className="space-y-4">
          {/* Basic Information */}
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
                />
              </div>

              <label className="flex items-center gap-2 text-[12px] text-slate-700">
                <input
                  type="checkbox"
                  checked={isGlobalRule}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setIsGlobalRule(next);
                    if (next) setFoodCategoryId("");
                  }}
                  className="h-4 w-4 rounded border-slate-300 accent-[#2563FF]"
                />
                Global rule (default for all categories)
              </label>

              {!isGlobalRule ? (
                <div className="space-y-2">
                  <FinanceFieldLabel required>Food Category</FinanceFieldLabel>
                  <select
                    value={foodCategoryId}
                    onChange={(e) => setFoodCategoryId(e.target.value)}
                    className={ADMIN_FIELD_BASE_CLASS}
                    aria-label="Food category"
                  >
                    <option value="">Select category</option>
                    {MOCK_CATEGORIES.map((c) => (
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
                />
              </div>
            </div>
          </div>

          {/* Period */}
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

          <FinanceCreateActions
            createLabel="Create Rule"
            onCancel={() => router.push("/admin/finance/commission-fees")}
          />
        </div>

        {/* Right summary */}
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

