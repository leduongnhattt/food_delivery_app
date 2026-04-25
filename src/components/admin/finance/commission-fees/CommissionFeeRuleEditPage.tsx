"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/toast-context";
import {
  CommissionFeeRuleForm,
  type CommissionFeeRuleFormValues,
  type FoodCategoryOption,
} from "@/components/admin/finance/commission-fees/CommissionFeeRuleForm";
import {
  fetchFoodCategoriesList,
  getCommissionFeeCategoryRule,
  updateCommissionFeeCategoryRule,
} from "@/services/admin.service";

export function CommissionFeeRuleEditPage({
  commissionDefaultId,
}: {
  commissionDefaultId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [categoryOptions, setCategoryOptions] = useState<FoodCategoryOption[]>([]);
  const [defaults, setDefaults] = useState<Partial<CommissionFeeRuleFormValues> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setReady(false);
    try {
      const [cats, rule] = await Promise.all([
        fetchFoodCategoriesList(),
        getCommissionFeeCategoryRule(commissionDefaultId),
      ]);
      setCategoryOptions(cats.categories.map((c) => ({ id: c.id, name: c.name })));
      setDefaults({
        ruleName: rule.RuleName ?? "",
        isGlobalRule: false,
        foodCategoryId: rule.FoodCategoryID,
        commissionPercent: String(rule.CommissionPercent),
        isActive: rule.IsActive,
        activatedAt: rule.ActivatedAt,
        expiredAt: rule.ExpiredAt,
        customPeriod: true,
        effectiveFrom: rule.EffectiveFrom,
        effectiveTo: rule.EffectiveTo ?? "",
      });
      setReady(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load rule");
    }
  }, [commissionDefaultId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(values: CommissionFeeRuleFormValues) {
    setError(null);
    const pct = Number(values.commissionPercent.trim().replace(",", "."));
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      setError("Commission percent must be between 0 and 100.");
      return;
    }
    const name = values.ruleName.trim();
    if (!name) {
      setError("Rule name is required.");
      return;
    }
    if (!values.foodCategoryId.trim()) {
      setError("Food category is required.");
      return;
    }
    if (values.customPeriod && !values.effectiveFrom.trim()) {
      setError("Start date is required when using a custom period.");
      return;
    }

    setSubmitting(true);
    try {
      const effectiveFrom = values.customPeriod
        ? values.effectiveFrom.trim()
        : new Date().toISOString().slice(0, 10);
      const effectiveToTrim = values.customPeriod ? values.effectiveTo.trim() : "";
      await updateCommissionFeeCategoryRule(commissionDefaultId, {
        foodCategoryId: values.foodCategoryId.trim(),
        ruleName: name,
        commissionPercent: pct,
        effectiveFrom,
        effectiveTo: effectiveToTrim ? effectiveToTrim : null,
      });
      showToast("Saved successfully.", "success");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      showToast(e instanceof Error ? e.message : "Request failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-rose-700">{loadError}</p>
        <button
          type="button"
          className="text-[12px] font-medium text-[#2563FF] underline"
          onClick={() => router.push("/admin/finance/commission-fees")}
        >
          Back to list
        </button>
      </div>
    );
  }

  if (!ready || !defaults) {
    return (
      <div className="p-8 text-center text-[13px] text-slate-500">Loading…</div>
    );
  }

  return (
    <CommissionFeeRuleForm
      title="Edit Commission Rule"
      subtitle="Update commission, category, or effective period for this rule."
      submitLabel="Save Changes"
      allowGlobalToggle={false}
      lockGlobal={false}
      categoryOptions={categoryOptions}
      defaultValues={defaults}
      lockCustomPeriod
      isSubmitting={submitting}
      errorMessage={error}
      onCancel={() => router.push("/admin/finance/commission-fees")}
      onSubmit={handleSubmit}
    />
  );
}
