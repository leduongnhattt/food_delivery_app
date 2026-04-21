"use client";

import Link from "next/link";
import { ChevronRight, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function IncomeBalanceOverview({
  loading,
  isVerified,
  balance,
  canWithdraw,
  withdrawing,
  onWithdrawClick,
  bankLoading,
  bankName,
  maskedAccountNumber,
  onSelectBank,
}: {
  loading: boolean;
  isVerified: boolean;
  balance: number;
  canWithdraw: boolean;
  withdrawing: boolean;
  onWithdrawClick: () => void;
  bankLoading: boolean;
  bankName: string | null;
  maskedAccountNumber: string | null;
  onSelectBank: () => void;
}) {
  return (
    <div className="rounded-sm border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-base font-medium text-gray-900">Balance Overview</h2>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-start divide-x divide-gray-200">
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
                    <span className="text-2xl font-semibold text-gray-900">{formatCurrency(balance)}</span>
                    <Eye className="h-4 w-4 cursor-pointer text-gray-400 hover:text-gray-600" aria-hidden />
                  </>
                )}
              </div>

              <button
                type="button"
                disabled={!isVerified || !canWithdraw || withdrawing}
                className="inline-flex h-9 items-center rounded-md bg-blue-700 px-6 text-sm font-medium text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onWithdrawClick}
              >
                Withdraw
              </button>
            </div>
          </div>

          <div className="w-[340px] pl-8">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-900">My Bank Account</span>
              <Link href="/enterprise/bank-accounts" className="flex items-center gap-0.5 text-blue-600 hover:underline">
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
                onClick={onSelectBank}
                className="w-full text-left"
                aria-label="Change bank account"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-white shadow-sm">
                    <span className="text-xs font-semibold text-gray-800">{(bankName || "").slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="mb-0.5 flex items-center gap-2">
                      <p className="truncate text-[13px] font-medium leading-tight text-gray-900">{bankName}</p>
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
                onClick={onSelectBank}
                className="w-full rounded border border-dashed border-gray-200 py-2 text-center text-xs italic text-gray-400 hover:bg-gray-50"
              >
                No bank account added
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

