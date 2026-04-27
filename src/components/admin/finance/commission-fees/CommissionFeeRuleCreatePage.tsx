"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/toast-context";
import {
  CommissionFeeRuleForm,
  type CommissionFeeRuleFormValues,
  type FoodCategoryOption,
} from "@/components/admin/finance/commission-fees/CommissionFeeRuleForm";
import {
  createCommissionFeeCategoryRule,
  fetchFoodCategoriesList,
  getCommissionFeesGlobal,
  updateCommissionFeesGlobal,
} from "@/services/admin.service";

export function CommissionFeeRuleCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopeGlobal = searchParams.get("scope") === "global";
  const { showToast } = useToast();

  const [categoryOptions, setCategoryOptions] = useState<FoodCategoryOption[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalPrefill, setGlobalPrefill] = useState<Partial<CommissionFeeRuleFormValues> | null>(
    null,
  );

  const loadCategories = useCallback(async () => {
    try {
      const categoriesResponse = await fetchFoodCategoriesList();
      setCategoryOptions(categoriesResponse.categories.map((c) => ({ id: c.id, name: c.name })));
    } catch {
      setCategoryOptions([]);
    } finally {
      setCategoriesLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!scopeGlobal) return;
    void (async () => {
      try {
        const globalRule = await getCommissionFeesGlobal();
        setGlobalPrefill({
          ruleName: globalRule.RuleName ?? "",
          isGlobalRule: true,
          foodCategoryId: "",
          commissionPercent: String(globalRule.CommissionPercent),
          isActive: globalRule.IsActive,
          customPeriod: true,
          effectiveFrom: globalRule.EffectiveFrom,
          effectiveTo: globalRule.EffectiveTo ?? "",
        });
      } catch {
        setGlobalPrefill({
          ruleName: "",
          isGlobalRule: true,
          foodCategoryId: "",
          commissionPercent: "0",
          isActive: true,
          customPeriod: false,
          effectiveFrom: "",
          effectiveTo: "",
        });
      }
    })();
  }, [scopeGlobal]);

  async function handleSubmit(values: CommissionFeeRuleFormValues) {
    setError(null);
    const commissionPercentNumber = Number(values.commissionPercent.trim().replace(",", "."));
    const trimmedRuleName = values.ruleName.trim();
    if (
      !Number.isFinite(commissionPercentNumber) ||
      commissionPercentNumber < 0 ||
      commissionPercentNumber > 100
    ) {
      return; // validated in form
    }
    if (!trimmedRuleName) return; // validated in form

    const global = scopeGlobal || values.isGlobalRule;
    if (!global) {
      if (!values.foodCategoryId.trim()) return; // validated in form
    }

    setSubmitting(true);
    try {
      if (global) {
        await updateCommissionFeesGlobal({
          ruleName: trimmedRuleName,
          commissionPercent: commissionPercentNumber,
          isActive: values.isActive,
          effectiveFrom: values.effectiveFrom.trim(),
          effectiveTo: values.effectiveTo.trim() ? values.effectiveTo.trim() : null,
        });
      } else {
        const effectiveToTrim = values.effectiveTo.trim();
        await createCommissionFeeCategoryRule({
          foodCategoryId: values.foodCategoryId.trim(),
          ruleName: trimmedRuleName,
          commissionPercent: commissionPercentNumber,
          isActive: true,
          effectiveFrom: values.effectiveFrom.trim(),
          effectiveTo: effectiveToTrim ? effectiveToTrim : null,
        });
      }
      showToast("Saved successfully.", "success");
      router.push("/admin/finance/commission-fees");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      showToast(e instanceof Error ? e.message : "Request failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!categoriesLoaded || (scopeGlobal && !globalPrefill)) {
    return (
      <div className="p-8 text-center text-[13px] text-slate-500">Loading…</div>
    );
  }

  return (
    <CommissionFeeRuleForm
      title={scopeGlobal ? "Edit Global Commission" : "Create New Commission Rule"}
      subtitle={
        scopeGlobal
          ? "Update the default commission applied across all categories."
          : "Set up a new commission fee rule for food categories."
      }
      submitLabel={scopeGlobal ? "Save Global Rule" : "Create Rule"}
      initialGlobal={scopeGlobal}
      lockGlobal={scopeGlobal}
      allowGlobalToggle={!scopeGlobal}
      categoryOptions={categoryOptions}
      defaultValues={scopeGlobal ? globalPrefill : null}
      isSubmitting={submitting}
      errorMessage={error}
      onCancel={() => router.push("/admin/finance/commission-fees")}
      onSubmit={handleSubmit}
    />
  );
}
