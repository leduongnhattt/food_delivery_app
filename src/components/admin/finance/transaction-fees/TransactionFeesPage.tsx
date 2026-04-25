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
import { ConfirmActionModal } from "@/components/ui/confirm-action-modal";
import { Pagination } from "@/components/ui/pagination";
import type { AdminTransactionFeeChannelRuleItem } from "@/types/admin-api.types";
import { useToast } from "@/contexts/toast-context";
import {
  activateTransactionFeeGlobalRule,
  getTransactionFeesGlobal,
  listTransactionFeeChannelRules,
  updateTransactionFeeChannelRule,
  updateTransactionFeeGlobalRule,
} from "@/services/admin.service";
import { TRANSACTION_FEE_PAYMENT_CHANNEL_FILTER_MENU } from "@/lib/transaction-fee-channels";
import type { TransactionFeePaymentChannelFilterId } from "@/lib/transaction-fee-channels";

type FeeStatus = "Pending" | "Active" | "Inactive" | "Expired";

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

function StatusPill({ status }: { status: FeeStatus }) {
  const cls =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "Pending"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : status === "Expired"
          ? "bg-rose-50 text-rose-800 border-rose-200"
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

function transactionRuleEditHref(row: AdminTransactionFeeChannelRuleItem): string {
  if (row.IsGlobal) {
    return `/admin/finance/transaction-fees/new?scope=global&globalRuleId=${encodeURIComponent(row.FeeID)}`;
  }
  return `/admin/finance/transaction-fees/${encodeURIComponent(row.FeeID)}/edit`;
}

export function TransactionFeesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const todayMax = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [searchText, setSearchText] = useState("");
  const [channel, setChannel] = useState<"all" | TransactionFeePaymentChannelFilterId>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | FeeStatus>("all");
  const [effectiveFromFilter, setEffectiveFromFilter] = useState("");
  const [effectiveToFilter, setEffectiveToFilter] = useState("");
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
  const [activateConfirmRow, setActivateConfirmRow] =
    useState<AdminTransactionFeeChannelRuleItem | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(searchText.trim()), 350);
    return () => window.clearTimeout(timeoutId);
  }, [searchText]);

  const loadGlobal = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const globalRule = await getTransactionFeesGlobal();
      setGlobalRow({
        DefaultID: globalRule.DefaultID,
        RatePercent: globalRule.RatePercent,
        EffectiveFrom: globalRule.EffectiveFrom,
      });
    } catch {
      setGlobalRow(null);
    } finally {
      setGlobalLoading(false);
    }
  }, []);

  const loadList = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) {
      setListLoading(true);
      setError(null);
    }
    try {
      const listResponse = await listTransactionFeeChannelRules({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        paymentChannel: channel === "all" ? undefined : channel,
        status: statusFilter === "all" ? undefined : statusFilter,
        effectiveFrom: effectiveFromFilter.trim() || undefined,
        effectiveTo: effectiveToFilter.trim() || undefined,
      });
      setRows(listResponse.items);
      setTotal(listResponse.total);
    } catch (e) {
      if (!silent) {
        setRows([]);
        setTotal(0);
        setError(e instanceof Error ? e.message : "Failed to load transaction fees");
      }
    } finally {
      if (!silent) setListLoading(false);
    }
  }, [
    page,
    pageSize,
    debouncedSearch,
    channel,
    statusFilter,
    effectiveFromFilter,
    effectiveToFilter,
  ]);

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

  const statusLabel = statusFilter === "all" ? "All Status" : statusFilter;
  const periodLabel =
    effectiveFromFilter && effectiveToFilter
      ? `${effectiveFromFilter} to ${effectiveToFilter}`
      : effectiveFromFilter
        ? `${effectiveFromFilter} onwards`
        : effectiveToFilter
          ? `Until ${effectiveToFilter}`
          : "Period";

  function resetPage() {
    setPage(1);
  }

  async function runToggleActive(row: AdminTransactionFeeChannelRuleItem): Promise<boolean> {
    const id = row.FeeID;
    setToggleBusyId(id);
    try {
      const next = !row.IsActive;
      await Promise.all([
        row.IsGlobal
          ? next
            ? activateTransactionFeeGlobalRule(id)
            : updateTransactionFeeGlobalRule(id, { isActive: false })
          : updateTransactionFeeChannelRule(id, { isActive: next }),
        new Promise<void>((r) => window.setTimeout(r, 450)),
      ]);
      await Promise.all([loadList({ silent: true }), loadGlobal()]);
      showToast(
        row.IsGlobal
          ? next
            ? "Global fee rule activated."
            : "Global fee rule deactivated."
          : next
            ? "Fee activated."
            : "Fee deactivated.",
        "success",
      );
      return true;
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed", "error");
      return false;
    } finally {
      setToggleBusyId(null);
    }
  }

  function onToggleActive(row: AdminTransactionFeeChannelRuleItem) {
    const id = row.FeeID;
    const next = !row.IsActive;
    if (next) {
      if (row.IsGlobal) {
        const hasAnotherActiveGlobal = rows.some(
          (x) =>
            !!x.IsGlobal &&
            x.FeeID !== id &&
            !!x.ActivatedAt &&
            !x.ExpiredAt &&
            x.IsActive,
        );
        if (hasAnotherActiveGlobal) {
          setActivateConfirmRow(row);
          return;
        }
      } else {
        const hasAnotherActiveSameChannel = rows.some(
          (x) =>
            !x.IsGlobal &&
            x.FeeID !== id &&
            x.PaymentMethod === row.PaymentMethod &&
            x.PaymentProviderCode === row.PaymentProviderCode &&
            !!x.ActivatedAt &&
            !x.ExpiredAt &&
            x.IsActive,
        );
        if (hasAnotherActiveSameChannel) {
          setActivateConfirmRow(row);
          return;
        }
      }
    }
    void runToggleActive(row);
  }

  return (
    <div className="space-y-4">
      <FinanceListPageHeader
        title="Transaction Fees"
        description="Manage transaction fee rules based on payment channels."
      />

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
          actionDisabled={!globalRow}
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
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
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
                        value={effectiveFromFilter}
                        onChange={(next) => {
                          setEffectiveFromFilter(next);
                          resetPage();
                        }}
                        mode="date"
                        placeholder="From"
                        max={todayMax}
                        align="start"
                        triggerClassName={ADMIN_FIELD_BASE_CLASS}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-[12px] font-medium text-slate-600">To</div>
                      <DateTimePickerField
                        value={effectiveToFilter}
                        onChange={(next) => {
                          setEffectiveToFilter(next);
                          resetPage();
                        }}
                        mode="date"
                        placeholder="To"
                        max={todayMax}
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
                        setEffectiveFromFilter("");
                        setEffectiveToFilter("");
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
                      { id: "Pending" as const, label: "Pending" },
                      { id: "Active" as const, label: "Active" },
                      { id: "Inactive" as const, label: "Inactive" },
                          { id: "Expired" as const, label: "Expired" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false);
                        setStatusFilter(opt.id);
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
                  const statusUi: FeeStatus = r.ExpiredAt
                    ? "Expired"
                    : r.ActivatedAt
                      ? r.IsActive
                        ? "Active"
                        : "Inactive"
                      : "Pending";
                  const primaryAction =
                    statusUi === "Active"
                      ? { label: "Deactivate", cls: "text-rose-600" }
                      : { label: "Activate", cls: "text-emerald-700" };
                  return (
                    <tr
                      key={r.IsGlobal ? `global:${r.FeeID}` : r.FeeID}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-2 pr-4 pl-4 font-mono text-[11px] text-slate-600">
                        {r.FeeID.length > 18 ? `${r.FeeID.slice(0, 18)}…` : r.FeeID}
                      </td>
                      <td className="py-2 pr-4">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(transactionRuleEditHref(r))
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
                              router.push(transactionRuleEditHref(r))
                            }
                            className="text-[12px] font-medium text-[#2563FF] hover:underline underline-offset-2"
                          >
                            Edit
                          </button>
                          {statusUi !== "Expired" ? (
                            <button
                              type="button"
                              disabled={toggleBusyId === r.FeeID}
                              onClick={() => void onToggleActive(r)}
                              className={`text-[12px] font-medium hover:underline underline-offset-2 disabled:opacity-50 ${primaryAction.cls}`}
                            >
                              {toggleBusyId === r.FeeID ? "…" : primaryAction.label}
                            </button>
                          ) : null}
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

      <ConfirmActionModal
        open={!!activateConfirmRow}
        title="Activate this rule?"
        message={
          activateConfirmRow?.IsGlobal ? (
            <p>
              If you activate this global rule, all other{" "}
              <span className="font-medium text-slate-800">platform global</span> fee rules will be set to{" "}
              <span className="font-medium text-slate-800">Inactive</span>.
            </p>
          ) : (
            <p>
              If you activate this rule, all other rules for the same payment channel will be set to{" "}
              <span className="font-medium text-slate-800">Inactive</span>.
            </p>
          )
        }
        confirmLabel="Activate"
        confirmTone="primary"
        confirmLoading={!!activateConfirmRow && toggleBusyId === activateConfirmRow.FeeID}
        onClose={() => {
          if (toggleBusyId) return;
          setActivateConfirmRow(null);
        }}
        onConfirm={() => {
          const row = activateConfirmRow;
          if (!row) return;
          void (async () => {
            const ok = await runToggleActive(row);
            if (ok) setActivateConfirmRow(null);
          })();
        }}
      />
    </div>
  );
}
