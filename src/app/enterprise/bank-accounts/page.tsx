"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/contexts/toast-context";
import { EnterprisePageHeader } from "@/components/enterprise/EnterprisePageHeader";
import { FinanceVerifyGate } from "@/components/enterprise/FinanceVerifyGate";
import { AddBankAccountModal, type AddBankAccountFormData } from "@/components/enterprise/balance/AddBankAccountModal";
import { EditBankAccountModal } from "@/components/enterprise/balance/EditBankAccountModal";
import { BankAccountCards } from "@/app/enterprise/bank-accounts/components/BankAccountCards";
import { BankAccountsPreview } from "@/app/enterprise/bank-accounts/components/BankAccountsPreview";
import {
  BankAccountApiError,
  EnterpriseBankAccountsService,
  type EnterpriseBankAccountRow,
} from "@/services/enterprise-bank-accounts.service";

/**
 * Bank accounts list shell aligned with mallplus-cms
 * `apps/seller/pages/balance/bank-accounts/index.vue` (grid + add tile).
 * Page-level password gate from MallPlus is omitted here until auth product parity exists.
 */
export default function EnterpriseBankAccountsPage() {
  const { showToast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<EnterpriseBankAccountRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EnterpriseBankAccountRow[]>([]);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await EnterpriseBankAccountsService.list();
      setRows(Array.isArray(res?.bankAccounts) ? res.bankAccounts : []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load bank accounts", "error");
      setRows([]);
    }
  }, [showToast]);

  const handleOpenAdd = useCallback(() => setAddOpen(true), []);

  const handleOpenEdit = useCallback((row: EnterpriseBankAccountRow) => {
    setSelected(row);
    setEditOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    if (saving) return;
    setEditOpen(false);
    setSelected(null);
  }, [saving]);

  const handleAddSave = useCallback(
    async (data: AddBankAccountFormData) => {
      try {
        setSaving(true);
        if (data.kind === "BankAccount") {
          const res = await EnterpriseBankAccountsService.create({
            kind: "BankAccount",
            bankName: data.bank_name,
            accountHolderName: data.account_holder,
            accountNumber: data.account_number,
            countryCode: data.country_code ?? "VN",
            isDefault: data.is_default,
          });
          if (!res?.success) throw new Error("Failed to create bank account");
        } else {
          const res = await EnterpriseBankAccountsService.create({
            kind: "EWallet",
            providerCode: data.provider_code ?? "stripe",
            walletRef: data.wallet_ref,
            walletDisplayName: data.wallet_display_name,
            isDefault: data.is_default,
          });
          if (!res?.success) throw new Error("Failed to create payout provider");
        }
        showToast("Bank account saved", "success");
        setAddOpen(false);
        await refresh();
      } catch (e) {
        console.error(e);
        if (e instanceof BankAccountApiError) {
          if (e.fieldErrors?._form) showToast(e.fieldErrors._form, "error");
          throw e;
        }
        showToast(e instanceof Error ? e.message : "Failed to save bank account", "error");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [refresh, showToast],
  );

  const handleEditSave = useCallback(
    async (patch: Record<string, unknown>) => {
      if (!selected) return;
      try {
        setSaving(true);
        await EnterpriseBankAccountsService.update(selected.id, patch as any);
        showToast("Bank account updated", "success");
        setEditOpen(false);
        setSelected(null);
        await refresh();
      } catch (e) {
        console.error(e);
        if (e instanceof BankAccountApiError) {
          if (e.fieldErrors?._form) showToast(e.fieldErrors._form, "error");
          throw e;
        }
        showToast(e instanceof Error ? e.message : "Failed to update bank account", "error");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [refresh, selected, showToast],
  );

  const handleEditDelete = useCallback(async () => {
    if (!selected) return;
    try {
      setSaving(true);
      await EnterpriseBankAccountsService.delete(selected.id);
      showToast("Bank account deleted", "success");
      setEditOpen(false);
      setSelected(null);
      await refresh();
    } catch (e) {
      console.error(e);
      showToast(e instanceof Error ? e.message : "Failed to delete bank account", "error");
      throw e;
    } finally {
      setSaving(false);
    }
  }, [refresh, selected, showToast]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return (
    <FinanceVerifyGate storageKey="enterprise_finance_verified:bank-accounts" preview={<BankAccountsPreview />}>
      <div className="w-full space-y-6">
      <EnterprisePageHeader
        title="Bank Accounts"
        description="Add and manage payout bank accounts for your shop."
      />

      <div className="bank-accounts-page w-full">
        <div className="mb-4 rounded-sm border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-medium text-gray-900">Add Bank Account</h2>

          <BankAccountCards
            rows={rows}
            loading={loading}
            onAdd={handleOpenAdd}
            onEdit={handleOpenEdit}
          />
        </div>
      </div>

      <AddBankAccountModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        isSaving={saving}
        onSave={handleAddSave}
      />

      <EditBankAccountModal
        open={editOpen}
        row={selected}
        isSaving={saving}
        onClose={handleCloseEdit}
        onSave={handleEditSave}
        onDelete={handleEditDelete}
      />
      </div>
    </FinanceVerifyGate>
  );
}
