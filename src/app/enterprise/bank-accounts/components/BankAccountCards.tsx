"use client";

import { useMemo } from "react";
import { Plus } from "lucide-react";
import { ENTERPRISE_PAYOUT_PROVIDERS } from "@/lib/enterprise-bank-names";
import type { EnterpriseBankAccountRow } from "@/services/enterprise-bank-accounts.service";

type CardVM = {
  id: string;
  isDefault: boolean;
  title: string;
  line1: string;
  line2: string | null;
  logoSrc: string | null;
  isMBBank: boolean;
};

function maskAccountNumber(s: string | null) {
  if (!s) return "—";
  const t = String(s).trim();
  if (t.length <= 4) return t;
  return `•••• ${t.slice(-4)}`;
}

function norm(s: string | null | undefined) {
  return (s || "").trim().toLowerCase();
}

function bankLogoSrc(bankName: string | null | undefined): string | null {
  const b = norm(bankName);
  if (!b) return null;
  if (b === "mbbank" || b === "mb bank" || b.includes("military")) return "/images/banks/mbbank.png";
  return null;
}

function mapToCardVM(rows: EnterpriseBankAccountRow[]): CardVM[] {
  const active = rows.filter((r) => r.isActive);
  return active.map((r) => {
    const provider = (r.providerCode ?? "").trim();
    const isProvider = r.kind === "EWallet" && provider.length > 0;
    const title = isProvider
      ? (ENTERPRISE_PAYOUT_PROVIDERS as any)[provider.toLowerCase()] ?? provider.toUpperCase()
      : (r.bankName ?? "Bank account");
    const line1 = isProvider ? (r.walletDisplayName ?? r.walletRef ?? "—") : maskAccountNumber(r.accountNumber);
    const line2 = isProvider ? (r.walletRef ?? null) : (r.accountHolderName ?? null);
    const logoSrc = !isProvider ? bankLogoSrc(r.bankName) : null;
    const isMBBank = !isProvider && norm(r.bankName) === "mbbank";
    return { id: r.id, isDefault: r.isDefault, title, line1, line2, logoSrc, isMBBank };
  });
}

export function BankAccountCards({
  rows,
  loading,
  onAdd,
  onEdit,
}: {
  rows: EnterpriseBankAccountRow[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (row: EnterpriseBankAccountRow) => void;
}) {
  const activeRows = useMemo(() => rows.filter((r) => r.isActive), [rows]);
  const cards = useMemo(() => mapToCardVM(rows), [rows]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" aria-hidden />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        role="button"
        tabIndex={0}
        onClick={onAdd}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAdd();
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
            const row = activeRows.find((r) => r.id === c.id);
            if (row) onEdit(row);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const row = activeRows.find((r) => r.id === c.id);
              if (row) onEdit(row);
            }
          }}
          className={[
            "group relative flex min-h-80 flex-col overflow-hidden rounded-lg p-5 text-white transition-all hover:shadow-lg hover:ring-2 hover:ring-blue-400",
            c.isMBBank ? "bg-gradient-to-br from-[#1F3DFF] via-[#1031E8] to-[#071B9C]" : "bg-[#2C3E50]",
          ].join(" ")}
        >
          {c.isMBBank ? (
            <>
              <div className="pointer-events-none absolute -top-10 right-[-70px] h-48 w-80 rounded-full bg-white/10" aria-hidden />
              <div className="pointer-events-none absolute top-10 right-[-90px] h-56 w-56 rounded-full bg-white/10" aria-hidden />
              <div className="pointer-events-none absolute -left-24 top-6 h-64 w-64 rotate-12 bg-white/10 blur-2xl" aria-hidden />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/banks/mbbank-logo.svg"
                      alt="MBBank"
                      className="h-9 w-auto object-contain"
                      loading="lazy"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/banks/chip-icons8.png" alt="" className="h-10 w-10 object-contain" loading="lazy" />
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
                    <div className="text-[22px] font-extrabold italic tracking-tight text-white/95">VISA</div>
                    <div className="-mt-1 text-[9px] font-semibold tracking-wider text-white/80">DEBIT</div>
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
                      <img src={c.logoSrc} alt={c.title} className="h-6 w-6 object-contain" loading="lazy" />
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
                {c.line2 ? <p className="truncate pt-1 text-[11px] text-white/70">{c.line2}</p> : null}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

