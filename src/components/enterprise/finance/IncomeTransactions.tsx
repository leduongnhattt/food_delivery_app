"use client";

import { useCallback } from "react";
import Link from "next/link";
import { Download, Inbox, Lock, Search } from "lucide-react";
import {
  clampISODate,
  formatCurrency,
  formatDateShort,
} from "@/lib/utils";
import {
  DropdownSelect,
  type DropdownSelectOption,
} from "@/components/ui/dropdown-select";
import { useToast } from "@/contexts/toast-context";

function csvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export type MoneyFlow = "all" | "in" | "out";
export type TxType = "order_income" | "withdrawal" | "adjustment" | "refund";
export type TxStatus = "all" | "success" | "pending" | "failed" | "expired" | "cancelled";

export type IncomeTxRow = {
  id: string;
  createdAtISO: string;
  transactionType: TxType;
  description: string;
  subtitle?: string | null;
  referenceId?: string | null;
  moneyFlow: "in" | "out";
  amount: number;
  status: "success" | "pending" | "failed" | "expired" | "cancelled";
};

function txTypeLabel(t: IncomeTxRow["transactionType"]): string {
  if (t === "order_income") return "Order income";
  if (t === "withdrawal") return "Withdrawal";
  if (t === "refund") return "Refund";
  return "Adjustment";
}

function statusLabel(status: IncomeTxRow["status"]): string {
  if (status === "expired") return "expired";
  if (status === "cancelled") return "cancelled";
  return status;
}

function downloadIncomeTransactionsCsv(rows: IncomeTxRow[]): void {
  const headers = [
    "#",
    "Reference ID",
    "Type",
    "Description",
    "Date",
    "Money Flow",
    "Amount",
    "Status",
  ];
  const lines: string[] = [headers.map(csvCell).join(",")];
  rows.forEach((tx, idx) => {
    lines.push(
      [
        csvCell(idx + 1),
        csvCell(tx.referenceId ?? "-"),
        csvCell(txTypeLabel(tx.transactionType)),
        csvCell(tx.description ?? ""),
        csvCell(formatDateShort(tx.createdAtISO)),
        csvCell(tx.moneyFlow),
        csvCell(formatCurrency(tx.amount)),
        csvCell(statusLabel(tx.status)),
      ].join(","),
    );
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = `enterprise-income-transactions-${stamp}.csv`;
  downloadLink.click();
  URL.revokeObjectURL(url);
}

const STATUS_OPTIONS: DropdownSelectOption[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export function IncomeTransactions({
  isVerified,
  loading,
  rows,
  dateFrom,
  dateTo,
  moneyFlow,
  txTypes,
  txStatus,
  searchOrderId,
  setDateFrom,
  setDateTo,
  setMoneyFlow,
  setTxTypes,
  setTxStatus,
  setSearchOrderId,
  onReset,
  onApply,
}: {
  isVerified: boolean;
  loading: boolean;
  rows: IncomeTxRow[];
  dateFrom: string;
  dateTo: string;
  moneyFlow: MoneyFlow;
  txTypes: TxType[];
  txStatus: TxStatus;
  searchOrderId: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  setMoneyFlow: (v: MoneyFlow) => void;
  setTxTypes: (fn: (prev: TxType[]) => TxType[]) => void;
  setTxStatus: (v: TxStatus) => void;
  setSearchOrderId: (v: string) => void;
  onReset: () => void | Promise<void>;
  onApply: () => void | Promise<void>;
}) {
  const { showToast } = useToast();

  const filtered = (() => {
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
  })();

  const onExportCsv = useCallback(() => {
    if (!isVerified) return;
    try {
      downloadIncomeTransactionsCsv(filtered);
      showToast(
        filtered.length
          ? `Exported ${filtered.length} row${filtered.length === 1 ? "" : "s"} to CSV.`
          : "Exported CSV (headers only — no rows match current filters).",
        "success",
      );
    } catch {
      showToast("Export failed. Please try again.", "error");
    }
  }, [filtered, isVerified, showToast]);

  return (
    <div className="rounded-sm border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-base font-medium text-gray-900">Recent Transactions</h2>

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
                  moneyFlow === opt.value ? "bg-gray-100 text-gray-900" : "bg-white text-gray-600 hover:bg-gray-50",
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
          <DropdownSelect
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
            onClick={() => void onReset()}
            className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isVerified}
          >
            Reset
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md bg-blue-700 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!isVerified}
            onClick={() => void onApply()}
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
                placeholder="Search by reference ID"
                className="h-9 w-80 rounded-md border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700"
                disabled={!isVerified}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isVerified || loading}
              title="Download current table as CSV"
              onClick={() => onExportCsv()}
            >
              <Download className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
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
                <th className="w-56 pb-3 font-medium">Reference ID</th>
                <th className="w-[360px] pb-3 font-medium">Type | Description</th>
                <th className="w-28 pb-3 font-medium">Date</th>
                <th className="w-24 pb-3 text-center font-medium">Money Flow</th>
                <th className="w-28 pb-3 pr-4 text-right font-medium">Amount</th>
                <th className="w-24 pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((tx, idx) => (
                <tr key={tx.id} className="group hover:bg-gray-50">
                  <td className="py-3 text-gray-600">{idx + 1}</td>
                  <td className="py-3">
                    <Link
                      href={`/enterprise/income/ledger/${encodeURIComponent(tx.id)}`}
                      className="block truncate whitespace-nowrap text-blue-600 hover:underline"
                    >
                      {tx.referenceId ?? "—"}
                    </Link>
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
                  <td className="py-3 pr-4 text-right font-semibold text-gray-900">{formatCurrency(tx.amount)}</td>
                  <td className="py-3 text-right text-gray-600">
                    {statusLabel(tx.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

