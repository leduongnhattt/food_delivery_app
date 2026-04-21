"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import {
  BankAccountApiError,
  EnterpriseBankAccountsService,
  type EnterpriseBankAccountRow,
} from "@/services/enterprise-bank-accounts.service";

function maskAccountNumber(s: string | null) {
  const t = String(s ?? "").trim();
  if (!t) return "—";
  if (t.length <= 4) return t;
  return `•••• ${t.slice(-4)}`;
}

export function SelectBankAccountModal({
  open,
  onClose,
  onSelected,
  currentDefaultId,
}: {
  open: boolean;
  onClose: () => void;
  onSelected: (row: EnterpriseBankAccountRow) => void | Promise<void>;
  currentDefaultId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<EnterpriseBankAccountRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const selectable = useMemo(() => {
    return rows.filter((r) => r.isActive && r.kind === "BankAccount");
  }, [rows]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const run = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await EnterpriseBankAccountsService.list();
        const list = Array.isArray(res?.bankAccounts) ? res.bankAccounts : [];
        if (cancelled) return;
        setRows(list);
        const preferred =
          (currentDefaultId && list.some((x) => x.id === currentDefaultId) ? currentDefaultId : null) ??
          list.find((x) => x.isDefault)?.id ??
          list.find((x) => x.isActive && x.kind === "BankAccount")?.id ??
          "";
        setSelectedId(preferred);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setRows([]);
        setSelectedId("");
        setError("Failed to load bank accounts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [open, currentDefaultId]);

  if (!open) return null;

  const picked = selectable.find((r) => r.id === selectedId) ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={() => {
        if (saving) return;
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="select-bank-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 id="select-bank-title" className="text-lg font-semibold text-gray-900">
              Select bank account
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onClose}
              aria-label="Close"
              disabled={saving}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="py-10 text-center">
              <div
                className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500"
                aria-hidden
              />
            </div>
          ) : selectable.length === 0 ? (
            <div className="rounded border border-dashed border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-700">No bank account available.</p>
              <p className="mt-1 text-xs text-gray-500">Add one first, then come back to select it here.</p>
              <div className="mt-3">
                <Link
                  href="/enterprise/bank-accounts"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Go to Bank Accounts
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {selectable.map((r) => {
                const isSelected = r.id === selectedId;
                return (
                  <label
                    key={r.id}
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                      isSelected ? "border-sky-300 bg-sky-50" : "border-gray-200 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="bank"
                      className="mt-1 h-4 w-4 text-sky-600"
                      checked={isSelected}
                      onChange={() => setSelectedId(r.id)}
                      disabled={saving}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-gray-900">{r.bankName ?? "Bank account"}</p>
                        {r.isDefault ? (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-green-700">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-600">{maskAccountNumber(r.accountNumber)}</p>
                      {r.accountHolderName ? (
                        <p className="mt-0.5 truncate text-[11px] text-gray-500">{r.accountHolderName}</p>
                      ) : null}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!picked || saving}
              className="inline-flex h-9 items-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={async () => {
                if (!picked || saving) return;
                try {
                  setError(null);
                  setSaving(true);
                  await EnterpriseBankAccountsService.update(picked.id, { isDefault: true });
                  await onSelected(picked);
                  onClose();
                } catch (e: any) {
                  console.error(e);
                  const msg = e instanceof BankAccountApiError ? e.message : "Failed to select bank account";
                  setError(msg);
                } finally {
                  setSaving(false);
                }
              }}
            >
              Set as default
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

