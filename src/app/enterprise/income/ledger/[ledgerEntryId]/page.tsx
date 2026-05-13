"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EnterprisePageHeader } from "@/components/enterprise/EnterprisePageHeader";
import { FinanceVerifyGate } from "@/components/enterprise/FinanceVerifyGate";
import { IncomePreview } from "@/components/enterprise/finance/IncomePreview";
import {
  EnterpriseIncomeService,
  type EnterpriseIncomeLedgerDetail,
} from "@/services/enterprise-finance.service";
import { formatCurrency, formatDateShort } from "@/lib/utils";
import { useToast } from "@/contexts/toast-context";
import { ConfirmActionModal } from "@/components/enterprise/ConfirmActionModal";

export default function EnterpriseIncomeLedgerDetailPage() {
  const router = useRouter();
  const routeParams = useParams<{ ledgerEntryId: string }>();
  const ledgerEntryId = decodeURIComponent(String(routeParams.ledgerEntryId ?? ""));
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<EnterpriseIncomeLedgerDetail | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!ledgerEntryId) return;
    setLoading(true);
    try {
      const response = await EnterpriseIncomeService.ledgerEntry(ledgerEntryId);
      setDetail(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load transaction.";
      showToast(message, "error");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [ledgerEntryId, showToast]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleConfirmCancel = useCallback(async () => {
    if (!ledgerEntryId || cancelling) return;
    setCancelling(true);
    try {
      await EnterpriseIncomeService.cancelLedgerWithdrawal(ledgerEntryId);
      showToast("Withdrawal cancelled. Your balance will reflect unlocked funds.", "success");
      setCancelModalOpen(false);
      await loadDetail();
      router.push("/enterprise/income");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not cancel withdrawal.";
      showToast(message, "error");
    } finally {
      setCancelling(false);
    }
  }, [cancelling, ledgerEntryId, loadDetail, router, showToast]);

  const entry = detail?.entry;
  const payout = detail?.payoutRequest;

  return (
    <FinanceVerifyGate storageKey="enterprise_finance_verified:income" preview={<IncomePreview />}>
      <div className="w-full space-y-6">
        <div>
          <Link
            href="/enterprise/income"
            className="mb-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to income
          </Link>
          <EnterprisePageHeader title="Transaction details" description="View ledger entry and manage withdrawal." />
        </div>

        {loading ? (
          <div className="rounded-sm border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Loading…
          </div>
        ) : !entry ? (
          <div className="rounded-sm border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
            Transaction not found.
          </div>
        ) : (
          <div className="space-y-4 rounded-sm border border-gray-200 bg-white p-6">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-gray-500">Reference ID</dt>
                <dd className="mt-0.5 break-all font-mono text-gray-900">{entry.referenceId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Reference type</dt>
                <dd className="mt-0.5 text-gray-900">{entry.referenceType ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Date</dt>
                <dd className="mt-0.5 text-gray-900">{formatDateShort(entry.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Status</dt>
                <dd className="mt-0.5 text-gray-900">{entry.status.toLowerCase()}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Type</dt>
                <dd className="mt-0.5 text-gray-900">{entry.transactionType}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">Money flow</dt>
                <dd className="mt-0.5 text-gray-900">{entry.moneyFlow}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500">Amount</dt>
                <dd className="mt-0.5 text-lg font-semibold text-gray-900">{formatCurrency(entry.amount)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500">Description</dt>
                <dd className="mt-0.5 text-gray-900">{entry.description || "—"}</dd>
              </div>
            </dl>

            {payout ? (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="mb-2 text-sm font-medium text-gray-900">Payout request</h3>
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-gray-500">Payout ID</dt>
                    <dd className="break-all font-mono text-gray-800">{payout.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Payout status</dt>
                    <dd className="text-gray-800">{payout.status.toLowerCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Amount</dt>
                    <dd className="font-medium text-gray-900">{formatCurrency(payout.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Expires</dt>
                    <dd className="text-gray-800">{formatDateShort(payout.expiresAt)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {detail?.canCancelWithdrawal ? (
              <div className="border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(true)}
                  className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                >
                  Cancel withdrawal request
                </button>
              </div>
            ) : null}
          </div>
        )}

        <ConfirmActionModal
          open={cancelModalOpen}
          title="Cancel withdrawal?"
          message={
            <p className="text-gray-700">
              This will mark the payout as cancelled and restore the amount to your available balance (pending admin
              rules no longer apply to this request).
            </p>
          }
          cancelLabel="Keep request"
          confirmLabel="Cancel withdrawal"
          confirmTone="danger"
          confirmLoading={cancelling}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={() => void handleConfirmCancel()}
        />
      </div>
    </FinanceVerifyGate>
  );
}
