"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EnterprisePageHeader } from "@/components/enterprise/EnterprisePageHeader";
import { EnterpriseBankAccountsService } from "@/services/enterprise-bank-accounts.service";
import { SelectBankAccountModal } from "@/components/enterprise/balance/SelectBankAccountModal";
import { ConfirmActionModal } from "@/components/enterprise/ConfirmActionModal";
import { FinanceVerifyGate } from "@/components/enterprise/FinanceVerifyGate";
import {
  EnterpriseIncomeService,
  type EnterpriseIncomeTx,
} from "@/services/enterprise-finance.service";
import { IncomePreview } from "@/components/enterprise/finance/IncomePreview";
import { IncomeBalanceOverview } from "@/components/enterprise/finance/IncomeBalanceOverview";
import {
  IncomeTransactions,
  type MoneyFlow,
  type IncomeTxRow,
  type TxStatus,
  type TxType,
} from "@/components/enterprise/finance/IncomeTransactions";
import { clampISODate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/contexts/toast-context";

export default function EnterpriseIncomePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  const [isVerified] = useState(true);

  const [balance, setBalance] = useState<number>(0);
  const [canWithdraw, setCanWithdraw] = useState<boolean>(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [confirmWithdrawOpen, setConfirmWithdrawOpen] = useState(false);
  const [bankName, setBankName] = useState<string | null>(null);
  const [maskedAccountNumber, setMaskedAccountNumber] = useState<string | null>(null);
  const [defaultBankId, setDefaultBankId] = useState<string | null>(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [selectOpen, setSelectOpen] = useState(false);

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [moneyFlow, setMoneyFlow] = useState<MoneyFlow>("all");
  const [txTypes, setTxTypes] = useState<TxType[]>([]);
  const [txStatus, setTxStatus] = useState<TxStatus>("all");
  const [searchOrderId, setSearchOrderId] = useState("");

  const [rows, setRows] = useState<IncomeTxRow[]>([]);

  const refreshBankPreview = useCallback(async () => {
    try {
      setBankLoading(true);
      const res = await EnterpriseBankAccountsService.list();
      const list = Array.isArray(res?.bankAccounts) ? res.bankAccounts : [];
      const active = list.filter((x) => x.isActive);
      const def = active.find((x) => x.isDefault) ?? null;
      if (!def || def.kind !== "BankAccount") {
        setBankName(null);
        setMaskedAccountNumber(null);
        setDefaultBankId(null);
        return;
      }
      const acct = String(def.accountNumber ?? "").trim();
      const masked = acct.length >= 4 ? `•••• ${acct.slice(-4)}` : acct || "—";
      setBankName(def.bankName ?? "Bank account");
      setMaskedAccountNumber(masked);
      setDefaultBankId(def.id);
    } finally {
      setBankLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const [s, tx] = await Promise.all([
          EnterpriseIncomeService.summary(),
          EnterpriseIncomeService.transactions({ limit: 50 }),
          refreshBankPreview(),
        ]);
        if (cancelled) return;
        setBalance(typeof s.balance === "number" ? s.balance : 0);
        setCanWithdraw(!!s.canWithdraw);
        const list = Array.isArray(tx.transactions) ? tx.transactions : [];
        setRows(list.map(mapTx));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [refreshBankPreview]);

  const refreshTransactions = useCallback(async () => {
    const tx = await EnterpriseIncomeService.transactions({
      from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      to: dateTo ? new Date(dateTo).toISOString() : undefined,
      moneyFlow,
      types: txTypes.map((t) => {
        if (t === "order_income") return "OrderIncome";
        if (t === "withdrawal") return "Withdrawal";
        if (t === "refund") return "Refund";
        return "Adjustment";
      }),
      searchOrderId: searchOrderId || undefined,
      limit: 50,
    });
    const list = Array.isArray(tx.transactions) ? tx.transactions : [];
    setRows(list.map(mapTx));
  }, [dateFrom, dateTo, moneyFlow, searchOrderId, txTypes]);

  function mapTx(t: EnterpriseIncomeTx): IncomeTxRow {
    const tt = (t.transactionType || "").toLowerCase();
    const transactionType: TxType =
      tt.includes("withdraw") ? "withdrawal" : tt.includes("refund") ? "refund" : tt.includes("adjust") ? "adjustment" : "order_income";
    const statusLower = (t.status || "").toLowerCase();
    const status: IncomeTxRow["status"] = statusLower.includes("cancel")
      ? "cancelled"
      : statusLower.includes("fail")
        ? "failed"
        : statusLower.includes("expire")
          ? "expired"
          : statusLower.includes("pending")
            ? "pending"
            : "success";
    return {
      id: t.id,
      createdAtISO: t.createdAt,
      transactionType,
      description: t.description || "",
      subtitle: null,
      referenceId: t.referenceId ?? null,
      moneyFlow: t.moneyFlow,
      amount: typeof t.amount === "number" ? t.amount : 0,
      status,
    };
  }

  const filtered = useMemo(() => {
    const from = clampISODate(dateFrom);
    const to = clampISODate(dateTo);
    const searchQueryLower = searchOrderId.trim().toLowerCase();
    const types = new Set(txTypes);
    return rows.filter((r) => {
      if (from && r.createdAtISO.slice(0, 10) < from) return false;
      if (to && r.createdAtISO.slice(0, 10) > to) return false;
      if (moneyFlow !== "all" && r.moneyFlow !== moneyFlow) return false;
      if (types.size > 0 && !types.has(r.transactionType)) return false;
      if (txStatus !== "all" && r.status !== txStatus) return false;
      if (searchQueryLower) {
        const ref = (r.referenceId ?? "").toLowerCase();
        if (!ref.includes(searchQueryLower)) return false;
      }
      return true;
    });
  }, [rows, dateFrom, dateTo, moneyFlow, txTypes, txStatus, searchOrderId]);

  const handleConfirmWithdraw = useCallback(async () => {
    if (withdrawing || !canWithdraw) return;
    try {
      setWithdrawing(true);
      const payoutDestinationId = defaultBankId ?? undefined;
      await EnterpriseIncomeService.withdraw({
        payoutDestinationId,
      });
      const summaryResponse = await EnterpriseIncomeService.summary();
      setBalance(typeof summaryResponse.balance === "number" ? summaryResponse.balance : 0);
      setCanWithdraw(!!summaryResponse.canWithdraw);
      await refreshTransactions();
      showToast("Withdrawal request created.", "success");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Withdraw failed.";
      showToast(message, "error");
    } finally {
      setWithdrawing(false);
      setConfirmWithdrawOpen(false);
    }
  }, [canWithdraw, defaultBankId, refreshTransactions, showToast, withdrawing]);

  return (
    <FinanceVerifyGate storageKey="enterprise_finance_verified:income" preview={<IncomePreview />}>
      <div className="w-full space-y-6">
      <EnterprisePageHeader title="My Income" description="Balance overview and recent transactions." />

      <SelectBankAccountModal
        open={selectOpen}
        onClose={() => setSelectOpen(false)}
        currentDefaultId={defaultBankId}
        onSelected={async () => {
          await refreshBankPreview();
        }}
      />

      <ConfirmActionModal
        open={confirmWithdrawOpen}
        title="Withdraw"
        message={
          <div className="space-y-2">
            <p className="text-gray-700">
              Create a withdraw request for <span className="font-semibold text-gray-900">{formatCurrency(balance)}</span>?
            </p>
            <p className="text-xs text-gray-500">
              This request will expire in 2 days if it’s not processed by admin.
            </p>
          </div>
        }
        cancelLabel="Cancel"
        confirmLabel="Confirm"
        confirmTone="primary"
        confirmLoading={withdrawing}
        onClose={() => setConfirmWithdrawOpen(false)}
        onConfirm={handleConfirmWithdraw}
      />

      <IncomeBalanceOverview
        loading={loading}
        isVerified={isVerified}
        balance={balance}
        canWithdraw={canWithdraw}
        withdrawing={withdrawing}
        onWithdrawClick={() => setConfirmWithdrawOpen(true)}
        bankLoading={bankLoading}
        bankName={bankName}
        maskedAccountNumber={maskedAccountNumber}
        onSelectBank={() => setSelectOpen(true)}
      />

      <IncomeTransactions
        isVerified={isVerified}
        loading={loading}
        rows={filtered}
        dateFrom={dateFrom}
        dateTo={dateTo}
        moneyFlow={moneyFlow}
        txTypes={txTypes}
        txStatus={txStatus}
        searchOrderId={searchOrderId}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        setMoneyFlow={setMoneyFlow}
        setTxTypes={setTxTypes}
        setTxStatus={setTxStatus}
        setSearchOrderId={setSearchOrderId}
        onReset={async () => {
          setDateFrom("");
          setDateTo("");
          setMoneyFlow("all");
          setTxTypes([]);
          setTxStatus("all");
          setSearchOrderId("");
          const tx = await EnterpriseIncomeService.transactions({ limit: 50 });
          const list = Array.isArray(tx.transactions) ? tx.transactions : [];
          setRows(list.map(mapTx));
        }}
        onApply={() => void refreshTransactions()}
      />
      </div>
    </FinanceVerifyGate>
  );
}

