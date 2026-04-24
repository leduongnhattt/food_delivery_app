"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ConfirmActionModal } from "@/components/enterprise/ConfirmActionModal";
import { ENTERPRISE_PAYOUT_PROVIDERS, ENTERPRISE_VN_BANK_NAMES } from "@/lib/enterprise-finance";
import type { EnterpriseBankAccountRow, FieldErrors } from "@/services/enterprise-bank-accounts.service";

export function EditBankAccountModal({
  open,
  row,
  isSaving,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  row: EnterpriseBankAccountRow | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (patch: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const isProvider = row?.kind === "EWallet";
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [providerCode, setProviderCode] = useState("stripe");
  const [providerRef, setProviderRef] = useState("");
  const [providerDisplayName, setProviderDisplayName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setErrors({});
    setIsDefault(!!row.isDefault);
    setBankName(row.bankName ?? "");
    setAccountHolder(row.accountHolderName ?? "");
    setAccountNumber(row.accountNumber ?? "");
    setProviderCode((row.providerCode ?? "stripe").toLowerCase());
    setProviderRef(row.walletRef ?? "");
    setProviderDisplayName(row.walletDisplayName ?? "");
  }, [open, row]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const digits = accountNumber.replace(/\D/g, "");
  const isFormValid = useMemo(() => {
    if (!row) return false;
    if (!isProvider) {
      return (
        bankName.trim().length > 0 &&
        accountHolder.trim().length > 0 &&
        /^[\p{L}\s.'-]+$/u.test(accountHolder) &&
        digits.length >= 10 &&
        digits.length <= 20
      );
    }
    if (!providerCode.trim()) return false;
    if (!providerRef.trim()) return false;
    if (providerCode === "stripe") return /^acct_[A-Za-z0-9]+$/.test(providerRef.trim());
    if (providerCode === "paypal") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerRef.trim());
    return true;
  }, [accountHolder, bankName, digits.length, isProvider, providerCode, providerRef, row]);

  if (!open || !row) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-bank-title"
          className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 id="edit-bank-title" className="text-lg font-semibold text-gray-900">
                Bank Account
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={onClose}
                aria-label="Close"
                disabled={isSaving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (isSaving) return;
                const nextErrors: FieldErrors = {};

                if (!isProvider) {
                  if (!bankName.trim()) nextErrors.bank_name = "Please select a bank";
                  if (!accountHolder.trim()) nextErrors.account_holder = "Please enter account holder name";
                  else if (!/^[\p{L}\s.'-]+$/u.test(accountHolder))
                    nextErrors.account_holder = "Name can only contain letters, spaces, and punctuation";
                  if (!digits) nextErrors.account_number = "Please enter account number";
                  else if (digits.length < 10) nextErrors.account_number = "Account number must be at least 10 digits";
                  else if (digits.length > 20) nextErrors.account_number = "Account number must be at most 20 digits";
                } else {
                  if (!providerCode.trim()) nextErrors.provider_code = "Please select a provider";
                  if (!providerRef.trim()) nextErrors.wallet_ref = "Please enter provider reference";
                  if (providerCode === "stripe" && providerRef.trim() && !/^acct_[A-Za-z0-9]+$/.test(providerRef.trim())) {
                    nextErrors.wallet_ref = "Stripe account ID must start with acct_…";
                  }
                  if (providerCode === "paypal" && providerRef.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerRef.trim())) {
                    nextErrors.wallet_ref = "PayPal reference must be an email";
                  }
                }

                if (Object.keys(nextErrors).length > 0) {
                  setErrors(nextErrors);
                  return;
                }

                setErrors({});
                const patch: Record<string, unknown> = { isDefault };
                if (!isProvider) {
                  patch.bankName = bankName.trim();
                  patch.accountHolderName = accountHolder.trim();
                  patch.accountNumber = digits;
                } else {
                  patch.providerCode = providerCode.trim();
                  patch.walletRef = providerRef.trim();
                  patch.walletDisplayName = providerDisplayName.trim() || undefined;
                }
                await onSave(patch);
              }}
            >
              {!isProvider ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => {
                        setBankName(e.target.value);
                        setErrors((p) => ({ ...p, bank_name: undefined, _form: undefined }));
                      }}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a bank</option>
                      {ENTERPRISE_VN_BANK_NAMES.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    {errors.bank_name ? <p className="mt-1 text-xs text-red-600">{errors.bank_name}</p> : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Full Name in the Bank Account <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={(e) => {
                        setAccountHolder(e.target.value);
                        setErrors((p) => ({ ...p, account_holder: undefined, _form: undefined }));
                      }}
                      maxLength={64}
                      placeholder="Enter account holder name"
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    {errors.account_holder ? (
                      <p className="mt-1 text-xs text-red-600">{errors.account_holder}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Account No <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={accountNumber}
                      onChange={(e) => {
                        setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 20));
                        setErrors((p) => ({ ...p, account_number: undefined, _form: undefined }));
                      }}
                      placeholder="Enter account number"
                      maxLength={20}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    {errors.account_number ? (
                      <p className="mt-1 text-xs text-red-600">{errors.account_number}</p>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Provider <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={providerCode}
                      onChange={(e) => {
                        setProviderCode(e.target.value);
                        setErrors((p) => ({ ...p, provider_code: undefined, wallet_ref: undefined, _form: undefined }));
                      }}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    >
                      {Object.entries(ENTERPRISE_PAYOUT_PROVIDERS).map(([code, label]) => (
                        <option key={code} value={code}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {errors.provider_code ? (
                      <p className="mt-1 text-xs text-red-600">{errors.provider_code}</p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Provider reference <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={providerRef}
                      onChange={(e) => {
                        setProviderRef(e.target.value);
                        setErrors((p) => ({ ...p, wallet_ref: undefined, _form: undefined }));
                      }}
                      placeholder={providerCode === "stripe" ? "acct_…" : providerCode === "paypal" ? "email@example.com" : "Enter reference"}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                    {errors.wallet_ref ? <p className="mt-1 text-xs text-red-600">{errors.wallet_ref}</p> : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Display name <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={providerDisplayName}
                      onChange={(e) => setProviderDisplayName(e.target.value)}
                      placeholder="e.g. International payout"
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-3 pt-2">
                <input
                  id="bank-default-edit"
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="bank-default-edit" className="text-sm text-gray-700">
                  Set as Default Receiving Account
                </label>
              </div>

              {errors._form ? <p className="text-sm text-red-600">{errors._form}</p> : null}

              <div className="flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex h-9 items-center rounded-md border border-red-200 bg-white px-4 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving || row.isDefault}
                  title={row.isDefault ? "Cannot delete default bank account" : "Delete"}
                >
                  Delete
                </button>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !isFormValid}
                    className="inline-flex h-9 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={confirmDelete}
        title="Delete bank account"
        message="This will remove the bank account from your payout destinations. This action is reversible by support."
        confirmLabel="Delete"
        confirmTone="danger"
        confirmLoading={isSaving}
        onClose={() => {
          if (isSaving) return;
          setConfirmDelete(false);
        }}
        onConfirm={() => void onDelete().then(() => setConfirmDelete(false))}
      />
    </>
  );
}

