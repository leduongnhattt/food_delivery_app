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

type PaymentChannel =
  | "Credit Card"
  | "Stripe"
  | "MoMo"
  | "VNPay"
  | "Cash"
  | "Bank Transfer";

export function TransactionFeeCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGlobal = searchParams.get("scope") === "global";
  const [feeName, setFeeName] = useState("");
  const [isGlobalRule, setIsGlobalRule] = useState(initialGlobal);
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel | "">("");
  const [rate, setRate] = useState("");
  const [customPeriod, setCustomPeriod] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");

  const summary = useMemo(() => {
    return {
      feeName: feeName.trim() || "—",
      paymentChannel: isGlobalRule ? "Global default" : paymentChannel || "—",
      rate: rate.trim() ? `${rate.trim()}%` : "—",
      period: customPeriod ? "Custom" : "Indefinite",
    };
  }, [feeName, isGlobalRule, paymentChannel, rate, customPeriod]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
          Create New Transaction Fee
        </h1>
        <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
          Set up a new transaction fee for a payment channel.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white">
            <FinanceCardTitle icon={<FileText className="h-4 w-4 text-[#2563FF]" />}>
              Basic Information
            </FinanceCardTitle>
            <div className="border-t border-slate-100 px-4 py-3 space-y-4">
              <div className="space-y-2">
                <FinanceFieldLabel required>Fee Name</FinanceFieldLabel>
                <input
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  placeholder="Enter fee name"
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
                    if (next) setPaymentChannel("");
                  }}
                  className="h-4 w-4 rounded border-slate-300 accent-[#2563FF]"
                />
                Global fee (default for all payment channels)
              </label>

              {!isGlobalRule ? (
                <div className="space-y-2">
                  <FinanceFieldLabel required>Payment Channel</FinanceFieldLabel>
                  <select
                    value={paymentChannel}
                    onChange={(e) => setPaymentChannel(e.target.value as any)}
                    className={ADMIN_FIELD_BASE_CLASS}
                    aria-label="Select payment channel"
                  >
                    <option value="">Select payment channel</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Stripe">Stripe</option>
                    <option value="MoMo">MoMo</option>
                    <option value="VNPay">VNPay</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              ) : null}

              <div className="space-y-2">
                <FinanceFieldLabel required>Transaction Fee Rate</FinanceFieldLabel>
                <InlineNumberField value={rate} onChange={setRate} suffix="%" placeholder="0.00" />
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
                emptyHint="This fee has no custom period and will remain active indefinitely."
              />
            </div>
          </div>

          <FinanceCreateActions
            createLabel="Create Fee"
            onCancel={() => router.push("/admin/finance/transaction-fees")}
          />
        </div>

        <FinanceSummaryCard
          items={[
            { label: "FEE NAME", value: summary.feeName },
            { label: "PAYMENT CHANNEL", value: summary.paymentChannel },
            { label: "TRANSACTION FEE RATE", value: summary.rate },
            { label: "PERIOD", value: summary.period },
          ]}
        />
      </div>
    </div>
  );
}

