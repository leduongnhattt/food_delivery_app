"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      setError("Transaction fee rate must be between 0 and 100.");
      return;
    }
    const name = values.feeName.trim();
    if (!name) {
      setError("Fee name is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (scopeGlobal) {
        const effectiveToTrim = values.customPeriod ? values.effectiveTo.trim() : "";
        await updateTransactionFeesGlobal({
          ruleName: name,
          ratePercent: rate,
          isActive: values.isActive,
          effectiveFrom: values.customPeriod
            ? values.effectiveFrom.trim()
            : new Date().toISOString().slice(0, 10),
          effectiveTo: values.customPeriod
            ? effectiveToTrim
              ? effectiveToTrim
              : null
            : null,
        });
      } else {
        if (!values.paymentChannelPostValue.trim()) {
          setError("Payment channel is required.");
          setSubmitting(false);
          return;
        }
        if (values.customPeriod && !values.effectiveFrom.trim()) {
          setError("Start date is required when using a custom period.");
          setSubmitting(false);
          return;
        }
        const effectiveToTrim = values.effectiveTo.trim();
        await createTransactionFeeChannelRule({
          paymentChannel: values.paymentChannelPostValue.trim(),
          feeName: name,
          ratePercent: rate,
          isActive: values.isActive,
          effectiveFrom: values.customPeriod
            ? values.effectiveFrom.trim()
            : new Date().toISOString().slice(0, 10),
          effectiveTo: values.customPeriod && effectiveToTrim ? effectiveToTrim : null,
        });
      }
      router.push("/admin/finance/transaction-fees");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
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
      variant={scopeGlobal ? "global" : "channel"}
      title={scopeGlobal ? "Edit Global Transaction Fee" : "Create New Transaction Fee"}
      subtitle={
        scopeGlobal
          ? "Update the default transaction fee, active flag, and effective period."
          : "Set up a new transaction fee for a payment channel."
      }
      submitLabel={scopeGlobal ? "Save Global Fee" : "Create Fee"}
      defaultValues={scopeGlobal ? globalPrefill : null}
      isSubmitting={submitting}
      errorMessage={error}
      onCancel={() => router.push("/admin/finance/transaction-fees")}
      onSubmit={handleSubmit}
    />
  );
}
