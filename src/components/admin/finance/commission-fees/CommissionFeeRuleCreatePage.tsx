"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

  const [categoryOptions, setCategoryOptions] = useState<FoodCategoryOption[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalPrefill, setGlobalPrefill] = useState<Partial<CommissionFeeRuleFormValues> | null>(
    null,
  );

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetchFoodCategoriesList();
      setCategoryOptions(res.categories.map((c) => ({ id: c.id, name: c.name })));
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
        const g = await getCommissionFeesGlobal();
        setGlobalPrefill({
          ruleName: g.RuleName ?? "",
          isGlobalRule: true,
          foodCategoryId: "",
          commissionPercent: String(g.CommissionPercent),
          customPeriod: false,
          effectiveFrom: "",
          effectiveTo: "",
        });
      } catch {
        setGlobalPrefill({
          ruleName: "",
          isGlobalRule: true,
          foodCategoryId: "",
          commissionPercent: "0",
          customPeriod: false,
          effectiveFrom: "",
          effectiveTo: "",
        });
      }
    })();
  }, [scopeGlobal]);

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

    const global = scopeGlobal || values.isGlobalRule;
    if (!global) {
      if (!values.foodCategoryId.trim()) {
        setError("Food category is required.");
        return;
      }
      if (values.customPeriod) {
        if (!values.effectiveFrom.trim()) {
          setError("Start date is required when using a custom period.");
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      if (global) {
        await updateCommissionFeesGlobal({
          ruleName: name,
          commissionPercent: pct,
        });
      } else {
        const effectiveToTrim = values.effectiveTo.trim();
        await createCommissionFeeCategoryRule({
          foodCategoryId: values.foodCategoryId.trim(),
          ruleName: name,
          commissionPercent: pct,
          isActive: true,
          effectiveFrom: values.effectiveFrom.trim(),
          effectiveTo: effectiveToTrim ? effectiveToTrim : null,
        });
      }
      router.push("/admin/finance/commission-fees");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
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
