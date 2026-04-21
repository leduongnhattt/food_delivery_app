"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ENTERPRISE_PAYOUT_PROVIDERS, ENTERPRISE_VN_BANK_NAMES } from "@/lib/enterprise-bank-names";
import type { FieldErrors } from "@/services/enterprise-bank-accounts.service";

export type AddBankAccountFormData = {
  kind: "BankAccount" | "EWallet";
  country_code?: string;
  bank_name?: string;
  account_holder?: string;
  account_number?: string;
  is_default: boolean;
  provider_code?: string;
  wallet_ref?: string;
  wallet_display_name?: string;
};

/**
 * Add-bank flow UI aligned with mallplus-cms `apps/seller/components/balance/AddBankAccountModal.vue`
 * (layout, copy, warning strip). Persistence is wired by the parent via `onSave`.
 */
export function AddBankAccountModal({
  open,
  onClose,
  onSave,
  isSaving = false,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: AddBankAccountFormData) => void | Promise<void>;
  isSaving?: boolean;
}) {
  const [method, setMethod] = useState<"vn_bank" | "provider">("vn_bank");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [providerCode, setProviderCode] = useState<string>("stripe");
  const [providerRef, setProviderRef] = useState("");
  const [providerDisplayName, setProviderDisplayName] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!open) {
      setMethod("vn_bank");
      setBankName("");
      setAccountHolder("");
      setAccountNumber("");
      setIsDefault(false);
      setProviderCode("stripe");
      setProviderRef("");
      setProviderDisplayName("");
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const accountNumberError = useMemo(() => {
    const val = accountNumber;
    if (!val) return null;
    if (!/^\d*$/.test(val)) return "Account number must contain only digits";
    if (val.length > 0 && val.length < 10) return "Account number must be at least 10 digits";
    if (val.length > 20) return "Account number must be at most 20 digits";
    return null;
  }, [accountNumber]);

  const digits = accountNumber.replace(/\D/g, "");
  const holderOk =
    accountHolder.trim().length > 0 &&
    accountHolder.length <= 64 &&
    /^[\p{L}\s.'-]+$/u.test(accountHolder);
  const providerOk = providerRef.trim().length > 0;
  const isFormValid =
    method === "vn_bank"
      ? bankName.trim().length > 0 && holderOk && digits.length >= 10 && digits.length <= 20
      : providerOk;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-bank-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 id="add-bank-title" className="text-lg font-semibold text-gray-900">
              Bank Account
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-4 text-sm text-gray-600">Add a new bank account to your profile..</p>

          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-yellow-600" aria-hidden>
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <p className="text-xs text-yellow-700">
                Please ensure that payee and bank account details are valid. As a safety measure, newly added bank
                accounts will be available for use after 12 hours.
              </p>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (isSaving) return;
              const nextErrors: FieldErrors = {};

              if (method === "vn_bank") {
                if (!bankName.trim()) nextErrors.bank_name = "Please select a bank";
                if (!accountHolder.trim()) nextErrors.account_holder = "Please enter account holder name";
                else if (accountHolder.length > 64) nextErrors.account_holder = "Name must be 64 characters or less";
                else if (!/^[\p{L}\s.'-]+$/u.test(accountHolder))
                  nextErrors.account_holder = "Name can only contain letters, spaces, and punctuation";
                if (!digits) nextErrors.account_number = "Please enter account number";
                else if (!/^\d+$/.test(digits)) nextErrors.account_number = "Account number must contain only digits";
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
              try {
                if (method === "vn_bank") {
                  await onSave({
                    kind: "BankAccount",
                    country_code: "VN",
                    bank_name: bankName.trim(),
                    account_holder: accountHolder.trim(),
                    account_number: digits,
                    is_default: isDefault,
                  });
                } else {
                  await onSave({
                    kind: "EWallet",
                    provider_code: providerCode.trim(),
                    wallet_ref: providerRef.trim(),
                    wallet_display_name: providerDisplayName.trim() || undefined,
                    is_default: isDefault,
                  });
                }
              } catch (err: any) {
                const fe = (err && typeof err === "object" ? (err.fieldErrors as FieldErrors | undefined) : undefined) ?? undefined;
                if (fe) setErrors(fe);
                else setErrors({ _form: err instanceof Error ? err.message : "Failed to save bank account" });
              }
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Payout method <span className="text-red-500">*</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as "vn_bank" | "provider")}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="vn_bank">Vietnam bank account</option>
                <option value="provider">International payout provider</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bank Name <span className="text-red-500">*</span>
              </label>
              {method === "vn_bank" ? (
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
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
              ) : (
                <select
                  value={providerCode}
                  onChange={(e) => {
                    setProviderCode(e.target.value);
                    setErrors((prev) => ({ ...prev, provider_code: undefined, wallet_ref: undefined, _form: undefined }));
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
              )}
              {method === "vn_bank" && errors.bank_name ? (
                <p className="mt-1 text-xs text-red-600">{errors.bank_name}</p>
              ) : null}
              {method === "provider" && errors.provider_code ? (
                <p className="mt-1 text-xs text-red-600">{errors.provider_code}</p>
              ) : null}
            </div>

            {method === "vn_bank" ? (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name in the Bank Account <span className="text-red-500">*</span>
                  </label>
                  <div className="mb-1 text-right text-xs text-gray-400">{accountHolder.length}/64</div>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => {
                      setAccountHolder(e.target.value);
                      setErrors((prev) => ({ ...prev, account_holder: undefined, _form: undefined }));
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
                      setErrors((prev) => ({ ...prev, account_number: undefined, _form: undefined }));
                    }}
                    placeholder="Enter account number"
                    maxLength={20}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {errors.account_number ? (
                    <p className="mt-1 text-xs text-red-600">{errors.account_number}</p>
                  ) : accountNumberError ? (
                    <p className="mt-1 text-xs text-red-600">{accountNumberError}</p>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Provider reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={providerRef}
                    onChange={(e) => {
                      setProviderRef(e.target.value);
                      setErrors((prev) => ({ ...prev, wallet_ref: undefined, _form: undefined }));
                    }}
                    placeholder={providerCode === "stripe" ? "acct_…" : providerCode === "paypal" ? "email@example.com" : "Enter reference / account"}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  {errors.wallet_ref ? (
                    <p className="mt-1 text-xs text-red-600">{errors.wallet_ref}</p>
                  ) : null}
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
                id="bank-default"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="bank-default" className="text-sm text-gray-700">
                Set as Default Receiving Account
              </label>
            </div>

            <p className="pt-4 text-xs text-gray-500">
              This account can only be used for buyer refunds or seller withdrawals
            </p>
            {errors._form ? <p className="text-sm text-red-600">{errors._form}</p> : null}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          </form>
        </div>
      </div>
    </div>
  );
}
