"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  ADMIN_FIELD_BASE_CLASS,
  FINANCE_FILTER_MENU_TRIGGER_WRAP,
  FINANCE_FILTER_PERIOD_WRAP,
  FINANCE_FILTER_SEARCH_WRAP,
} from "@/components/admin/shared/admin-field-classes";
import { adminFilterMenuTriggerClass } from "@/components/admin/shared/admin-filter-trigger";
import {
  FinanceGlobalDefaultCard,
  FinanceListPageHeader,
  FinanceRulesListCardShell,
} from "@/components/admin/shared/finance-list-ui";
import { DateTimePickerField } from "@/components/ui/date-time-picker";
import { Pagination } from "@/components/ui/pagination";
import type { AdminTransactionFeeChannelRuleItem } from "@/types/admin-api.types";
import {
  getTransactionFeesGlobal,
  listTransactionFeeChannelRules,
  updateTransactionFeeChannelRule,
} from "@/services/admin.service";
import { TRANSACTION_FEE_PAYMENT_CHANNEL_FILTER_MENU } from "@/lib/transaction-fee-channels";
import type { TransactionFeePaymentChannelFilterId } from "@/lib/transaction-fee-channels";

type FeeStatus = "Active" | "Inactive";

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

function StatusPill({ status }: { status: FeeStatus }) {
  const cls =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex rounded px-2 py-1 text-[11px] leading-4 border ${cls}`}>
      {status}
    </span>
  );
}

function formatRulePeriod(row: AdminTransactionFeeChannelRuleItem): string {
  if (row.EffectiveTo) {
    return `${row.EffectiveFrom} to ${row.EffectiveTo}`;
  }
  return `${row.EffectiveFrom} to Present`;
}

export function TransactionFeesPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState<"all" | TransactionFeePaymentChannelFilterId>("all");
  const [status, setStatus] = useState<"all" | FeeStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(12);
  const [page, setPage] = useState(1);
  const [openChannelMenu, setOpenChannelMenu] = useState(false);
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const [openPeriod, setOpenPeriod] = useState(false);
  const channelMenuRef = useRef<HTMLDivElement | null>(null);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const periodRef = useRef<HTMLDivElement | null>(null);

  const [globalRow, setGlobalRow] = useState<{
    DefaultID: string;
    RatePercent: number;
    EffectiveFrom: string;
  } | null>(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [rows, setRows] = useState<AdminTransactionFeeChannelRuleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(q.trim()), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const loadGlobal = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const g = await getTransactionFeesGlobal();
      setGlobalRow({
        DefaultID: g.DefaultID,
        RatePercent: g.RatePercent,
        EffectiveFrom: g.EffectiveFrom,
      });
    } catch {
      setGlobalRow(null);
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setError(null);
    try {
      const isActiveParam = status === "all" ? undefined : status === "Active";
      const res = await listTransactionFeeChannelRules({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        paymentChannel: channel === "all" ? undefined : channel,
        isActive: isActiveParam,
        effectiveFrom: from.trim() || undefined,
        effectiveTo: to.trim() || undefined,
      });
      setRows(res.items);
      setTotal(res.total);
    } catch (e) {
      setRows([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : "Failed to load transaction fees");
    } finally {
      setListLoading(false);
    }
  }, [page, pageSize, debouncedSearch, channel, status, from, to]);

  useEffect(() => {
    void loadGlobal();
  }, [loadGlobal]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null;
      const clickedChannel = !!(channelMenuRef.current && t && channelMenuRef.current.contains(t));
      const clickedStatus = !!(statusMenuRef.current && t && statusMenuRef.current.contains(t));
      const clickedPeriod = !!(periodRef.current && t && periodRef.current.contains(t));
      if (!clickedChannel) setOpenChannelMenu(false);
      if (!clickedStatus) setOpenStatusMenu(false);
      if (!clickedPeriod) setOpenPeriod(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const channelLabel = useMemo(() => {
    const found = TRANSACTION_FEE_PAYMENT_CHANNEL_FILTER_MENU.find((o) => o.filterId === channel);
    return found?.label ?? "Payment channel";
  }, [channel]);

  const statusLabel = status === "all" ? "All Status" : status;
  const periodLabel =
    from && to ? `${from} to ${to}` : from ? `${from} onwards` : to ? `Until ${to}` : "Period";

  function resetPage() {
    setPage(1);
  }

  async function onToggleActive(row: AdminTransactionFeeChannelRuleItem) {
    const id = row.FeeID;
    setToggleBusyId(id);
    setError(null);
    try {
      await updateTransactionFeeChannelRule(id, { isActive: !row.IsActive });
      await loadList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setToggleBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <FinanceListPageHeader
        title="Transaction Fees"
        description="Manage transaction fee rules based on payment channels."
      />

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-800">
          {error}
        </div>
      ) : null}

      {globalLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-[13px] text-slate-500">
          Loading global fee…
        </div>
      ) : (
        <FinanceGlobalDefaultCard
          ruleId={globalRow?.DefaultID}
          rateLabel="Transaction Fee Rule"
          ratePct={globalRow?.RatePercent ?? null}
          effectiveFrom={globalRow?.EffectiveFrom ?? null}
          actionLabel="Edit Global Fee"
          onAction={() => router.push("/admin/finance/transaction-fees/new?scope=global")}
        />
      )}

      <FinanceRulesListCardShell
        title="Transaction Fees"
        createLabel="Create New Fee"
        onCreate={() => router.push("/admin/finance/transaction-fees/new")}
        filters={
          <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <div className={FINANCE_FILTER_SEARCH_WRAP}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  resetPage();
                }}
                placeholder="Search by fee name"
                className={`${ADMIN_FIELD_BASE_CLASS} ps-10`}
              />
            </div>

            <div ref={periodRef} className={FINANCE_FILTER_PERIOD_WRAP}>
              <button
                type="button"
                onMouseDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setOpenPeriod((v) => !v);
                  setOpenChannelMenu(false);
                  setOpenStatusMenu(false);
                }}
                className={adminFilterMenuTriggerClass(openPeriod)}
                aria-label="Period"
                aria-haspopup="dialog"
                aria-expanded={openPeriod}
              >
                <span className="truncate">{periodLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    openPeriod ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openPeriod ? (
                <div
                  role="dialog"
                  aria-label="Period filter"
                  onClick={(ev) => ev.stopPropagation()}
                  className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,360px)] min-w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg overflow-visible"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <div className="text-[12px] font-medium text-slate-600">From</div>
                      <DateTimePickerField
                        value={from}
                        onChange={(next) => {
                          setFrom(next);
                          resetPage();
                        }}
                        mode="date"
                        placeholder="From"
                        align="start"
                        triggerClassName={ADMIN_FIELD_BASE_CLASS}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[12px] font-medium text-slate-600">To</div>
                      <DateTimePickerField
                        value={to}
                        onChange={(next) => {
                          setTo(next);
                          resetPage();
                        }}
                        mode="date"
                        placeholder="To"
                        align="start"
                        triggerClassName={ADMIN_FIELD_BASE_CLASS}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-start">
                    <button
                      type="button"
                      className="text-[12px] font-medium text-slate-600 hover:text-slate-900"
                      onClick={() => {
                        setFrom("");
                        setTo("");
                        resetPage();
                        setOpenPeriod(false);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={channelMenuRef} className={FINANCE_FILTER_MENU_TRIGGER_WRAP}>
              <button
                type="button"
                onMouseDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setOpenChannelMenu((v) => !v);
                  setOpenStatusMenu(false);
                  setOpenPeriod(false);
                }}
                className={adminFilterMenuTriggerClass(openChannelMenu)}
                aria-label="Payment channel"
                aria-haspopup="menu"
                aria-expanded={openChannelMenu}
              >
                <span className="truncate">{channelLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    openChannelMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openChannelMenu && (
                <div
                  onClick={(ev) => ev.stopPropagation()}
                  className="absolute left-0 right-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                >
                  {TRANSACTION_FEE_PAYMENT_CHANNEL_FILTER_MENU.map((opt) => (
                    <button
                      key={opt.filterId}
                      type="button"
                      onClick={() => {
                        setOpenChannelMenu(false);
                        setChannel(opt.filterId);
                        resetPage();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span className="truncate">{opt.label}</span>
                      {channel === opt.filterId && (
                        <Check className="w-4 h-4 shrink-0 text-slate-700" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div ref={statusMenuRef} className={FINANCE_FILTER_MENU_TRIGGER_WRAP}>
              <button
                type="button"
                onMouseDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setOpenStatusMenu((v) => !v);
                  setOpenChannelMenu(false);
                  setOpenPeriod(false);
                }}
                className={adminFilterMenuTriggerClass(openStatusMenu)}
                aria-label="Status"
                aria-haspopup="menu"
                aria-expanded={openStatusMenu}
              >
                <span className="truncate">{statusLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    openStatusMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openStatusMenu && (
                <div
                  onClick={(ev) => ev.stopPropagation()}
                  className="absolute left-0 right-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                >
                  {(
                    [
                      { id: "all" as const, label: "All Status" },
                      { id: "Active" as const, label: "Active" },
                      { id: "Inactive" as const, label: "Inactive" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false);
                        setStatus(opt.id);
                        resetPage();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>{opt.label}</span>
                      {status === opt.id && <Check className="w-4 h-4 text-slate-700" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
        pagination={
          <Pagination
            page={safePage}
            pageSize={pageSize}
            total={total}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageChange={setPage}
            onPageSizeChange={(n) => {
              setPageSize(n as (typeof PAGE_SIZE_OPTIONS)[number]);
              setPage(1);
            }}
          />
        }
      >
        <div className="mt-2 overflow-x-auto">
          {listLoading ? (
            <div className="py-12 text-center text-[13px] text-slate-500">Loading fees…</div>
          ) : (
            <table className="min-w-full text-[12px] leading-4">
              <thead>
                <tr className="bg-[#f9fbfc] text-left border-y border-slate-200">
                  <th className="py-2 pr-4 pl-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Fee ID
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Fee Name
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Payment Channel
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Rate (%)
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Period
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Status
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Created Date
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const primaryAction =
                    r.IsActive
                      ? { label: "Deactivate", cls: "text-rose-600" }
                      : { label: "Activate", cls: "text-emerald-700" };
                  const statusUi: FeeStatus = r.IsActive ? "Active" : "Inactive";
                  return (
                    <tr key={r.FeeID} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 pr-4 pl-4 font-mono text-[11px] text-slate-600">
                        {r.FeeID.length > 18 ? `${r.FeeID.slice(0, 18)}…` : r.FeeID}
                      </td>
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/finance/transaction-fees/${encodeURIComponent(r.FeeID)}/edit`,
                            )
                          }
                          className="text-[12px] font-medium text-[#2563FF] hover:underline underline-offset-2 text-left"
                        >
                          {r.FeeName}
                        </button>
                      </td>
                      <td className="py-2 pr-4 text-slate-600">{r.PaymentChannelLabel}</td>
                      <td className="py-2 pr-4 text-slate-700">{r.RatePercent.toFixed(2)}%</td>
                      <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">
                        {formatRulePeriod(r)}
                      </td>
                      <td className="py-2 pr-4">
                        <StatusPill status={statusUi} />
                      </td>
                      <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">{r.CreatedAt}</td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/admin/finance/transaction-fees/${encodeURIComponent(r.FeeID)}/edit`,
                              )
                            }
                            className="text-[12px] font-medium text-[#2563FF] hover:underline underline-offset-2"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={toggleBusyId === r.FeeID}
                            onClick={() => void onToggleActive(r)}
                            className={`text-[12px] font-medium hover:underline underline-offset-2 disabled:opacity-50 ${primaryAction.cls}`}
                          >
                            {toggleBusyId === r.FeeID ? "…" : primaryAction.label}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No fees
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </FinanceRulesListCardShell>
    </div>
  );
}
