"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/toast-context";
import {
  TransactionFeeRuleForm,
  type TransactionFeeRuleFormValues,
} from "@/components/admin/finance/transaction-fees/TransactionFeeRuleForm";
import {
  getTransactionFeeChannelRule,
  updateTransactionFeeChannelRule,
} from "@/services/admin.service";
import { TRANSACTION_FEE_PAYMENT_CHANNELS } from "@/lib/transaction-fee-channels";

function postValueFromChannelLabel(label: string): string {
  const row = TRANSACTION_FEE_PAYMENT_CHANNELS.find((c) => c.label === label);
  return row?.postValue ?? label;
}

export function TransactionFeeRuleEditPage({ feeId }: { feeId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [defaults, setDefaults] = useState<Partial<TransactionFeeRuleFormValues> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setReady(false);
    try {
      const rule = await getTransactionFeeChannelRule(feeId);
      const postValue = postValueFromChannelLabel(rule.PaymentChannelLabel);
      setDefaults({
        feeName: rule.FeeName,
        paymentChannelPostValue: postValue,
        ratePercent: String(rule.RatePercent),
        isActive: rule.IsActive,
        activatedAt: rule.ActivatedAt,
        expiredAt: rule.ExpiredAt,
        customPeriod: true,
        effectiveFrom: rule.EffectiveFrom,
        effectiveTo: rule.EffectiveTo ?? "",
      });
      setReady(true);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load fee");
    }
  }, [feeId]);

  useEffect(() => {
    void load();
  }, [load]);

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
    if (!values.paymentChannelPostValue.trim()) {
      setError("Payment channel is required.");
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
      await updateTransactionFeeChannelRule(feeId, {
        paymentChannel: values.paymentChannelPostValue.trim(),
        feeName: name,
        ratePercent: rate,
        isActive: values.isActive,
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
          onClick={() => router.push("/admin/finance/transaction-fees")}
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
    <TransactionFeeRuleForm
      variant="channel"
      title="Edit Transaction Fee"
      subtitle="Update fee name, channel, rate, period, or active status."
      submitLabel="Save Changes"
      defaultValues={defaults}
      lockCustomPeriod
      isSubmitting={submitting}
      errorMessage={error}
      onCancel={() => router.push("/admin/finance/transaction-fees")}
      onSubmit={handleSubmit}
    />
  );
}
