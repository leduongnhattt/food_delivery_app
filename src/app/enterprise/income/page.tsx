"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Eye, Inbox, Lock, Search } from "lucide-react";
import { EnterprisePageHeader } from "@/components/enterprise/EnterprisePageHeader";
import { EnterpriseBankAccountsService } from "@/services/enterprise-bank-accounts.service";
import { SelectBankAccountModal } from "@/components/enterprise/balance/SelectBankAccountModal";
import { ConfirmActionModal } from "@/components/enterprise/ConfirmActionModal";
import { FinanceVerifyGate } from "@/components/enterprise/FinanceVerifyGate";
import {
  EnterpriseMenuSelect,
  type EnterpriseMenuSelectOption,
} from "@/components/enterprise/orders/shared/EnterpriseMenuSelect";
import {
  EnterpriseIncomeService,
  type EnterpriseIncomeSummary,
  type EnterpriseIncomeTx,
} from "@/services/enterprise-income.service";

type MoneyFlow = "all" | "in" | "out";
type TxType = "order_income" | "withdrawal" | "adjustment" | "refund";
type TxStatus = "all" | "success" | "pending" | "failed";

const STATUS_OPTIONS: EnterpriseMenuSelectOption[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

type IncomeTxRow = {
  id: string;
  createdAtISO: string;
  transactionType: TxType;
  description: string;
  subtitle?: string | null;
  referenceId?: string | null; // e.g. order id
  moneyFlow: "in" | "out";
  amount: number; // signed
  status: "success" | "pending" | "failed";
};

function formatCurrency(v: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `${v.toFixed(2)} ${currency}`;
  }
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "2-digit" });
}

function clampISODate(s: string) {
  const t = (s || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : "";
}

export default function EnterpriseIncomePage() {
  const [loading, setLoading] = useState(true);

  const [isVerified] = useState(true);

  const [summary, setSummary] = useState<EnterpriseIncomeSummary | null>(null);
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
        setSummary(s);
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
    const status: IncomeTxRow["status"] =
      statusLower.includes("fail") ? "failed" : statusLower.includes("pending") ? "pending" : "success";
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
    const q = searchOrderId.trim().toLowerCase();
    const types = new Set(txTypes);
    return rows.filter((r) => {
      if (from && r.createdAtISO.slice(0, 10) < from) return false;
      if (to && r.createdAtISO.slice(0, 10) > to) return false;
      if (moneyFlow !== "all" && r.moneyFlow !== moneyFlow) return false;
      if (types.size > 0 && !types.has(r.transactionType)) return false;
      if (txStatus !== "all" && r.status !== txStatus) return false;
      if (q) {
        const ref = (r.referenceId ?? "").toLowerCase();
        if (!ref.includes(q)) return false;
      }
      return true;
    });
  }, [rows, dateFrom, dateTo, moneyFlow, txTypes, txStatus, searchOrderId]);

  const preview = (
    <div className="w-full space-y-6">
      <div className="h-12 w-64 rounded bg-gray-200" aria-hidden />
      <div className="rounded-sm border border-gray-200 bg-white p-5">
        <div className="h-4 w-40 rounded bg-gray-200" aria-hidden />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-24 rounded bg-gray-200" aria-hidden />
          <div className="h-24 rounded bg-gray-200" aria-hidden />
          <div className="h-24 rounded bg-gray-200" aria-hidden />
        </div>
      </div>
      <div className="rounded-sm border border-gray-200 bg-white p-5">
        <div className="h-4 w-48 rounded bg-gray-200" aria-hidden />
        <div className="mt-4 h-48 rounded bg-gray-200" aria-hidden />
      </div>
    </div>
  );

  return (
    <FinanceVerifyGate storageKey="enterprise_finance_verified:income" preview={preview}>
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
        onConfirm={async () => {
          if (withdrawing || !canWithdraw) return;
          try {
            setWithdrawing(true);
            const payoutDestinationId = defaultBankId ?? undefined;
            await EnterpriseIncomeService.withdraw({
              payoutDestinationId,
              settlementId: summary?.settlement?.id ?? undefined,
            });
            const s = await EnterpriseIncomeService.summary();
            setSummary(s);
            setBalance(typeof s.balance === "number" ? s.balance : 0);
            setCanWithdraw(!!s.canWithdraw);
            await refreshTransactions();
          } finally {
            setWithdrawing(false);
            setConfirmWithdrawOpen(false);
          }
        }}
      />

      {/* Balance Overview */}
      <div className="rounded-sm border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-base font-medium text-gray-900">Balance Overview</h2>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-start divide-x divide-gray-200">
            {/* Left: balance */}
            <div className="flex-1 pr-12">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Seller Balance</span>
                <span className="text-[10px] text-gray-400">Auto-withdrawal: OFF</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {loading ? (
                    <div className="h-7 w-32 animate-pulse rounded bg-gray-200" />
                  ) : (
                    <>
                      <span className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(balance)}
                      </span>
                      <Eye className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600" aria-hidden />
                    </>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!isVerified || !canWithdraw || withdrawing}
                  className="inline-flex h-9 items-center rounded-md bg-blue-700 px-6 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setConfirmWithdrawOpen(true)}
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* Right: bank preview */}
            <div className="w-[340px] pl-8">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-900">My Bank Account</span>
                <Link
                  href="/enterprise/bank-accounts"
                  className="flex items-center gap-0.5 text-blue-600 hover:underline"
                >
                  More <ChevronRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>

              {bankLoading ? (
                <div className="flex animate-pulse items-center gap-3">
                  <div className="h-10 w-10 rounded bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 rounded bg-gray-200" />
                    <div className="h-2 w-32 rounded bg-gray-200" />
                  </div>
                </div>
              ) : bankName ? (
                <button
                  type="button"
                  onClick={() => setSelectOpen(true)}
                  className="w-full text-left"
                  aria-label="Change bank account"
                >
                  <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-white shadow-sm">
                    <span className="text-xs font-semibold text-gray-800">
                      {(bankName || "").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="mb-0.5 flex items-center gap-2">
                      <p className="truncate text-[13px] font-medium leading-tight text-gray-900">
                        {bankName}
                      </p>
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-green-700">
                        Default
                      </span>
                    </div>
                    <p className="text-[11px] leading-tight text-gray-500">{maskedAccountNumber}</p>
                    <p className="mt-1 text-[11px] text-gray-400">Checked</p>
                  </div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectOpen(true)}
                  className="w-full rounded border border-dashed border-gray-200 py-2 text-center text-xs italic text-gray-400 hover:bg-gray-50"
                >
                  No bank account added
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-sm border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-base font-medium text-gray-900">Recent Transactions</h2>

        {/* Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-36 text-xs text-gray-500">Transaction Creation Date</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-700"
                disabled={!isVerified}
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-xs text-gray-700"
                disabled={!isVerified}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-36 text-xs text-gray-500">Money Flow</span>
            <div className="flex overflow-hidden rounded border border-gray-200">
              {[
                { value: "all" as const, label: "All" },
                { value: "in" as const, label: "In" },
                { value: "out" as const, label: "Out" },
              ].map((opt, idx, arr) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMoneyFlow(opt.value)}
                  disabled={!isVerified}
                  className={[
                    "px-4 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                    moneyFlow === opt.value
                      ? "bg-gray-100 text-gray-900"
                      : "bg-white text-gray-600 hover:bg-gray-50",
                    idx !== arr.length - 1 ? "border-r border-gray-200" : "",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-start gap-2">
            <span className="w-36 pt-1 text-xs text-gray-500">Transaction Type</span>
            <div className="flex flex-wrap gap-3">
              {[
                { value: "order_income" as const, label: "Order income" },
                { value: "withdrawal" as const, label: "Withdrawal" },
                { value: "refund" as const, label: "Refund" },
                { value: "adjustment" as const, label: "Adjustment" },
              ].map((t) => {
                const checked = txTypes.includes(t.value);
                return (
                  <label key={t.value} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setTxTypes((prev) => {
                          if (e.target.checked) return [...prev, t.value];
                          return prev.filter((x) => x !== t.value);
                        });
                      }}
                      disabled={!isVerified}
                      className="h-4 w-4 rounded border-gray-300 text-sky-600"
                    />
                    <span className="text-xs text-gray-700">{t.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-36 text-xs text-gray-500">Status</span>
            <EnterpriseMenuSelect
              value={txStatus}
              onChange={(v) => setTxStatus(v as TxStatus)}
              options={STATUS_OPTIONS}
              className="w-44"
              alignMenu="left"
              usePortal
              aria-label="Status"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                setDateFrom("");
                setDateTo("");
                setMoneyFlow("all");
                setTxTypes([]);
                setTxStatus("all");
                setSearchOrderId("");
                await EnterpriseIncomeService.transactions({ limit: 50 }).then((tx) => {
                  const list = Array.isArray(tx.transactions) ? tx.transactions : [];
                  setRows(list.map(mapTx));
                });
              }}
              className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isVerified}
            >
              Reset
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-md bg-blue-700 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isVerified}
              onClick={() => {
                void refreshTransactions();
              }}
            >
              Apply
            </button>
          </div>
        </div>

        <div className="mb-4 border-t border-gray-200 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
                <input
                  value={searchOrderId}
                  onChange={(e) => setSearchOrderId(e.target.value)}
                  placeholder="Search Order ID"
                  className="h-9 w-80 rounded-md border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700"
                  disabled={!isVerified}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isVerified}
                title="Export (coming soon)"
              >
                Export
              </button>
            </div>
          </div>
        </div>

        {!isVerified ? (
          <div className="py-12 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-gray-200" aria-hidden />
            <p className="text-sm text-gray-400">Verify your password to view transactions</p>
          </div>
        ) : loading ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" aria-hidden />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Inbox className="mx-auto mb-3 h-12 w-12 text-gray-200" aria-hidden />
            <p className="text-sm text-gray-500">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="w-12 pb-3 font-medium">#</th>
                  <th className="w-56 pb-3 font-medium">Order ID</th>
                  <th className="w-[360px] pb-3 font-medium">Type | Description</th>
                  <th className="w-28 pb-3 font-medium">Date</th>
                  <th className="w-24 pb-3 text-center font-medium">Money Flow</th>
                  <th className="w-28 pb-3 pr-4 text-right font-medium">Amount</th>
                  <th className="w-24 pb-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((tx, idx) => (
                  <tr key={tx.id} className="group cursor-pointer hover:bg-gray-50">
                    <td className="py-3 text-gray-600">{idx + 1}</td>
                    <td className="py-3">
                      <span className="block truncate whitespace-nowrap text-blue-600 hover:underline">
                        {tx.referenceId ?? "-"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{tx.description}</p>
                        {tx.subtitle ? (
                          <p className="truncate text-[10px] leading-tight text-gray-500">{tx.subtitle}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{formatDateShort(tx.createdAtISO)}</td>
                    <td className="py-3 text-center text-gray-600">{tx.moneyFlow}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-gray-900">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 text-right text-gray-600">{tx.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </FinanceVerifyGate>
  );
}

