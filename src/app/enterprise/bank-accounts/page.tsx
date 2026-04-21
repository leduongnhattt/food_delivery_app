"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import { EnterprisePageHeader } from "@/components/enterprise/EnterprisePageHeader";
import { FinanceVerifyGate } from "@/components/enterprise/FinanceVerifyGate";
import { AddBankAccountModal } from "@/components/enterprise/balance/AddBankAccountModal";
import { EditBankAccountModal } from "@/components/enterprise/balance/EditBankAccountModal";
import {
  BankAccountApiError,
  EnterpriseBankAccountsService,
  type EnterpriseBankAccountRow,
} from "@/services/enterprise-bank-accounts.service";
import { ENTERPRISE_PAYOUT_PROVIDERS } from "@/lib/enterprise-bank-names";

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

  const refresh = async () => {
    try {
      const res = await EnterpriseBankAccountsService.list();
      setRows(Array.isArray(res?.bankAccounts) ? res.bankAccounts : []);
    } catch (e) {
      console.error(e);
      showToast("Failed to load bank accounts", "error");
      setRows([]);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = useMemo(() => rows.filter((r) => r.isActive), [rows]);
  const cards = useMemo(() => {
    const mask = (s: string | null) => {
      if (!s) return "—";
      const t = String(s).trim();
      if (t.length <= 4) return t;
      return `•••• ${t.slice(-4)}`;
    };
    const norm = (s: string | null | undefined) => (s || "").trim().toLowerCase();
    const bankLogoSrc = (bankName: string | null | undefined): string | null => {
      const b = norm(bankName);
      if (!b) return null;
      if (b === "mbbank" || b === "mb bank" || b.includes("military")) return "/images/banks/mbbank.png";
      return null;
    };

    return active.map((r) => {
      const provider = (r.providerCode ?? "").trim();
      const isProvider = r.kind === "EWallet" && provider.length > 0;
      const title = isProvider
        ? (ENTERPRISE_PAYOUT_PROVIDERS as any)[provider.toLowerCase()] ?? provider.toUpperCase()
        : (r.bankName ?? "Bank account");
      const line1 = isProvider ? (r.walletDisplayName ?? r.walletRef ?? "—") : mask(r.accountNumber);
      const line2 = isProvider ? (r.walletRef ?? null) : (r.accountHolderName ?? null);
      const logoSrc = !isProvider ? bankLogoSrc(r.bankName) : null;
      const isMBBank = !isProvider && norm(r.bankName) === "mbbank";
      return {
        id: r.id,
        isDefault: r.isDefault,
        title,
        line1,
        line2,
        logoSrc,
        isActive: r.isActive,
        isMBBank,
      };
    });
  }, [active]);

  const preview = (
    <div className="w-full space-y-6">
      <div className="h-12 w-64 rounded bg-gray-200" aria-hidden />
      <div className="rounded-sm border border-gray-200 bg-white p-5">
        <div className="h-4 w-44 rounded bg-gray-200" aria-hidden />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="min-h-80 rounded bg-gray-200" aria-hidden />
          <div className="min-h-80 rounded bg-gray-200" aria-hidden />
          <div className="min-h-80 rounded bg-gray-200" aria-hidden />
        </div>
      </div>
    </div>
  );

  return (
    <FinanceVerifyGate storageKey="enterprise_finance_verified:bank-accounts" preview={preview}>
      <div className="w-full space-y-6">
      <EnterprisePageHeader
        title="Bank Accounts"
        description="Add and manage payout bank accounts for your shop."
      />

      <div className="bank-accounts-page w-full">
        <div className="mb-4 rounded-sm border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-medium text-gray-900">Add Bank Account</h2>

          {loading ? (
            <div className="py-8 text-center">
              <div
                className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500"
                aria-hidden
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setAddOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setAddOpen(true);
                  }
                }}
                className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:bg-gray-50"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-gray-200">
                  <Plus className="h-6 w-6 text-gray-400" strokeWidth={1.5} />
                </div>
                <span className="text-[12px] font-medium text-gray-400">Add Bank Account</span>
              </div>

              {cards.map((c) => (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const row = active.find((r) => r.id === c.id) ?? null;
                    setSelected(row);
                    setEditOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const row = active.find((r) => r.id === c.id) ?? null;
                      setSelected(row);
                      setEditOpen(true);
                    }
                  }}
                  className={[
                    "group relative flex min-h-80 flex-col overflow-hidden rounded-lg p-5 text-white transition-all hover:shadow-lg hover:ring-2 hover:ring-blue-400",
                    c.isMBBank ? "bg-gradient-to-br from-[#1F3DFF] via-[#1031E8] to-[#071B9C]" : "bg-[#2C3E50]",
                  ].join(" ")}
                >
                  {c.isMBBank ? (
                    <>
                      {/* subtle curves + shine like MB sample card */}
                      <div
                        className="pointer-events-none absolute -top-10 right-[-70px] h-48 w-80 rounded-full bg-white/10"
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute top-10 right-[-90px] h-56 w-56 rounded-full bg-white/10"
                        aria-hidden
                      />
                      <div
                        className="pointer-events-none absolute -left-24 top-6 h-64 w-64 rotate-12 bg-white/10 blur-2xl"
                        aria-hidden
                      />

                      <div className="relative z-10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-col gap-4">
                            {/* MBBank logo */}
                            {/* Official MBBank logo (SVG asset, transparent) */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/images/banks/mbbank-logo.svg"
                              alt="MBBank"
                              className="h-9 w-auto object-contain"
                              loading="lazy"
                            />

                            {/* Chip (Icons8) */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/images/banks/chip-icons8.png"
                              alt=""
                              className="h-10 w-10 object-contain"
                              loading="lazy"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-100 ring-1 ring-emerald-300/30">
                              Active
                            </span>
                            {c.isDefault ? (
                              <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold text-white/90 ring-1 ring-white/25">
                                Default
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 mt-auto pt-12">
                        <div className="flex items-end justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold tracking-wide text-white/95">
                              {(c.line2 ?? "—").toString().toUpperCase()}
                            </p>
                            <p className="mt-2 text-[13px] font-semibold text-white/95">{c.line1}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-[22px] font-extrabold italic tracking-tight text-white/95">
                              VISA
                            </div>
                            <div className="-mt-1 text-[9px] font-semibold tracking-wider text-white/80">
                              DEBIT
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-auto flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-sm bg-white p-1 shadow-sm">
                            {c.logoSrc ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={c.logoSrc}
                                alt={c.title}
                                className="h-6 w-6 object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="px-2 py-1 text-[11px] font-semibold text-slate-900">{c.title}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-emerald-300">Active</span>
                        </div>
                        {c.isDefault ? (
                          <span className="rounded bg-[#A8E6CF] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#1B5E20]">
                            Default
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 space-y-1">
                        <p className="truncate text-sm font-semibold tracking-tight">{c.title}</p>
                        <p className="text-[13px] font-medium text-white/90">{c.line1}</p>
                        {c.line2 ? (
                          <p className="truncate pt-1 text-[11px] text-white/70">{c.line2}</p>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddBankAccountModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        isSaving={saving}
        onSave={async (data) => {
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
        }}
      />

      <EditBankAccountModal
        open={editOpen}
        row={selected}
        isSaving={saving}
        onClose={() => {
          if (saving) return;
          setEditOpen(false);
          setSelected(null);
        }}
        onSave={async (patch) => {
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
        }}
        onDelete={async () => {
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
        }}
      />
      </div>
    </FinanceVerifyGate>
  );
}
