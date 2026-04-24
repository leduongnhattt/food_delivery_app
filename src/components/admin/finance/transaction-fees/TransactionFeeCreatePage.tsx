"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/toast-context";
import {
  TransactionFeeRuleForm,
  type TransactionFeeRuleFormValues,
} from "@/components/admin/finance/transaction-fees/TransactionFeeRuleForm";
import {
  createTransactionFeeChannelRule,
  getTransactionFeesGlobal,
  updateTransactionFeesGlobal,
} from "@/services/admin.service";

export function TransactionFeeCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopeGlobal = searchParams.get("scope") === "global";
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalPrefill, setGlobalPrefill] = useState<
    Partial<TransactionFeeRuleFormValues> | null
  >(null);

  const loadGlobalPrefill = useCallback(async () => {
    try {
      const g = await getTransactionFeesGlobal();
      setGlobalPrefill({
        feeName: g.RuleName ?? "",
        isGlobalRule: true,
        ratePercent: String(g.RatePercent),
        isActive: g.IsActive,
        customPeriod: true,
        effectiveFrom: g.EffectiveFrom,
        effectiveTo: g.EffectiveTo ?? "",
        paymentChannelPostValue: "",
      });
    } catch {
      setGlobalPrefill({
        feeName: "",
        isGlobalRule: true,
        ratePercent: "0",
        isActive: true,
        customPeriod: false,
        effectiveFrom: "",
        effectiveTo: "",
        paymentChannelPostValue: "",
      });
    }
  }, []);

  useEffect(() => {
    if (!scopeGlobal) return;
    void loadGlobalPrefill();
  }, [scopeGlobal, loadGlobalPrefill]);

  async function handleSubmit(values: TransactionFeeRuleFormValues) {
    setError(null);
    const rate = Number(values.ratePercent.trim().replace(",", "."));
    const name = values.feeName.trim();
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return; // validated in form
    if (!name) return; // validated in form

    setSubmitting(true);
    try {
      const global = scopeGlobal || values.isGlobalRule;
      if (global) {
        await updateTransactionFeesGlobal({
          ruleName: name,
          ratePercent: rate,
          isActive: values.isActive,
          effectiveFrom: values.effectiveFrom.trim(),
          effectiveTo: values.effectiveTo.trim() ? values.effectiveTo.trim() : null,
        });
      } else {
        if (!values.paymentChannelPostValue.trim()) return; // validated in form
        const effectiveToTrim = values.effectiveTo.trim();
        await createTransactionFeeChannelRule({
          paymentChannel: values.paymentChannelPostValue.trim(),
          feeName: name,
          ratePercent: rate,
          isActive: values.isActive,
          effectiveFrom: values.effectiveFrom.trim(),
          effectiveTo: effectiveToTrim ? effectiveToTrim : null,
        });
      }
      showToast("Saved successfully.", "success");
      router.push("/admin/finance/transaction-fees");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      showToast(e instanceof Error ? e.message : "Request failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (scopeGlobal && !globalPrefill) {
    return (
      <div className="p-8 text-center text-[13px] text-slate-500">Loading…</div>
    );
  }

  return (
    <TransactionFeeRuleForm
      variant="channel"
      title={scopeGlobal ? "Edit Global Transaction Fee" : "Create New Transaction Fee"}
      subtitle={
        scopeGlobal
          ? "Update the default transaction fee, active flag, and effective period."
          : "Set up a new transaction fee for a payment channel."
      }
      submitLabel={scopeGlobal ? "Save Global Fee" : "Create Fee"}
      initialGlobal={scopeGlobal}
      lockGlobal={scopeGlobal}
      allowGlobalToggle={!scopeGlobal}
      defaultValues={scopeGlobal ? globalPrefill : null}
      isSubmitting={submitting}
      errorMessage={error}
      onCancel={() => router.push("/admin/finance/transaction-fees")}
      onSubmit={handleSubmit}
    />
  );
}
