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
import type { AdminCommissionFeeCategoryRuleItem } from "@/types/admin-api.types";
import { useToast } from "@/contexts/toast-context";
import {
  fetchFoodCategoriesList,
  activateCommissionFeeGlobalRule,
  getCommissionFeesGlobal,
  listCommissionFeeCategoryRules,
  updateCommissionFeeCategoryRule,
  updateCommissionFeeGlobalRule,
} from "@/services/admin.service";

type RuleStatus = "Pending" | "Active" | "Inactive" | "Expired";

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

function StatusPill({ status }: { status: RuleStatus }) {
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

function displayRuleName(row: AdminCommissionFeeCategoryRuleItem): string {
  const ruleName = row.RuleName?.trim();
  if (ruleName) return ruleName;
  if (row.IsGlobal) return row.CategoryName;
  return `${row.CategoryName} Commission Default`;
}

function commissionRuleEditHref(row: AdminCommissionFeeCategoryRuleItem): string {
  if (row.IsGlobal) {
    return `/admin/finance/commission-fees/new?scope=global&globalRuleId=${encodeURIComponent(row.CommissionDefaultID)}`;
  }
  return `/admin/finance/commission-fees/${encodeURIComponent(row.CommissionDefaultID)}/edit`;
}

export function CommissionFeesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const todayMax = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | RuleStatus>("all");
  const [effectiveFromFilter, setEffectiveFromFilter] = useState("");
  const [effectiveToFilter, setEffectiveToFilter] = useState("");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(12);
  const [page, setPage] = useState(1);
  const [openCategoryMenu, setOpenCategoryMenu] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const [openStatusMenu, setOpenStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const [openPeriod, setOpenPeriod] = useState(false);
  const periodRef = useRef<HTMLDivElement | null>(null);

  const [globalRow, setGlobalRow] = useState<{
    DefaultID: string;
    CommissionPercent: number;
    EffectiveFrom: string;
  } | null>(null);
  const [rows, setRows] = useState<AdminCommissionFeeCategoryRuleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [toggleBusyId, setToggleBusyId] = useState<string | null>(null);
  const [activateConfirmRow, setActivateConfirmRow] =
    useState<AdminCommissionFeeCategoryRuleItem | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(searchText.trim()), 350);
    return () => window.clearTimeout(timeoutId);
  }, [searchText]);

  const loadCategories = useCallback(async () => {
    try {
      const categoriesResponse = await fetchFoodCategoriesList();
      setCategoryOptions(
        categoriesResponse.categories
          .map((c) => ({ id: c.id, name: c.name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch {
      setCategoryOptions([]);
    }
  }, []);

  const loadGlobal = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const globalRule = await getCommissionFeesGlobal();
      setGlobalRow({
        DefaultID: globalRule.DefaultID,
        CommissionPercent: globalRule.CommissionPercent,
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
    if (!silent) setListLoading(true);
    try {
      const listResponse = await listCommissionFeeCategoryRules({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        foodCategoryId: categoryFilter === "all" ? undefined : categoryFilter,
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
      }
      // Intentionally keep the UI clean (no error banner per design).
    } finally {
      if (!silent) setListLoading(false);
    }
  }, [
    page,
    pageSize,
    debouncedSearch,
    categoryFilter,
    statusFilter,
    effectiveFromFilter,
    effectiveToFilter,
  ]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadGlobal();
  }, [loadGlobal]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  function resetPageOnFilter() {
    setPage(1);
  }

  useEffect(() => {
    function onDocMouseDown(ev: MouseEvent) {
      const t = ev.target as Node | null;
      const clickedCategory = !!(categoryMenuRef.current && t && categoryMenuRef.current.contains(t));
      const clickedStatus = !!(statusMenuRef.current && t && statusMenuRef.current.contains(t));
      const clickedPeriod = !!(periodRef.current && t && periodRef.current.contains(t));
      if (!clickedCategory) setOpenCategoryMenu(false);
      if (!clickedStatus) setOpenStatusMenu(false);
      if (!clickedPeriod) setOpenPeriod(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const categoryLabel = useMemo(() => {
    if (categoryFilter === "all") return "All Categories";
    const found = categoryOptions.find((c) => c.id === categoryFilter);
    return found?.name ?? "Category";
  }, [categoryFilter, categoryOptions]);

  const statusLabel = statusFilter === "all" ? "All Status" : statusFilter;
  const periodLabel =
    effectiveFromFilter && effectiveToFilter
      ? `${effectiveFromFilter} to ${effectiveToFilter}`
      : effectiveFromFilter
        ? `${effectiveFromFilter} onwards`
        : effectiveToFilter
          ? `Until ${effectiveToFilter}`
          : "Period";

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function runToggleActive(row: AdminCommissionFeeCategoryRuleItem): Promise<boolean> {
    const id = row.CommissionDefaultID;
    setToggleBusyId(id);
    try {
      const next = !row.IsActive;
      await Promise.all([
        row.IsGlobal
          ? next
            ? activateCommissionFeeGlobalRule(id)
            : updateCommissionFeeGlobalRule(id, { isActive: false })
          : updateCommissionFeeCategoryRule(id, { isActive: next }),
        new Promise<void>((r) => window.setTimeout(r, 450)),
      ]);
      await Promise.all([loadList({ silent: true }), loadGlobal()]);
      showToast(
        row.IsGlobal
          ? next
            ? "Global rule activated."
            : "Global rule deactivated."
          : next
            ? "Rule activated."
            : "Rule deactivated.",
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

  function onToggleActive(row: AdminCommissionFeeCategoryRuleItem) {
    const id = row.CommissionDefaultID;
    const next = !row.IsActive;
    if (next) {
      if (row.IsGlobal) {
        const hasAnotherActiveGlobal = rows.some(
          (x) =>
            !!x.IsGlobal &&
            x.CommissionDefaultID !== id &&
            !!x.ActivatedAt &&
            !x.ExpiredAt &&
            x.IsActive,
        );
        if (hasAnotherActiveGlobal) {
          setActivateConfirmRow(row);
          return;
        }
      } else {
        const hasAnotherActiveSameCategory = rows.some(
          (x) =>
            !x.IsGlobal &&
            x.CommissionDefaultID !== id &&
            x.FoodCategoryID === row.FoodCategoryID &&
            !!x.ActivatedAt &&
            !x.ExpiredAt &&
            x.IsActive,
        );
        if (hasAnotherActiveSameCategory) {
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
        title="Commission Fees"
        description="Manage commission fee rules for your marketplace."
      />

      {globalLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-[13px] text-slate-500">
          Loading global commission…
        </div>
      ) : (
        <FinanceGlobalDefaultCard
          ruleId={globalRow?.DefaultID}
          rateLabel="Global Commission"
          ratePct={globalRow?.CommissionPercent ?? null}
          effectiveFrom={globalRow?.EffectiveFrom ?? null}
          actionLabel="Edit Global Rule"
          actionDisabled={!globalRow}
          onAction={() => router.push("/admin/finance/commission-fees/new?scope=global")}
        />
      )}

      <FinanceRulesListCardShell
        title="Commission Fees"
        createLabel="Create New Rule"
        onCreate={() => router.push("/admin/finance/commission-fees/new")}
        filters={
          <div className="flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <div className={FINANCE_FILTER_SEARCH_WRAP}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  resetPageOnFilter();
                }}
                placeholder="Search by category or rule name"
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
                  setOpenCategoryMenu(false);
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
                          resetPageOnFilter();
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
                          resetPageOnFilter();
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
                        resetPageOnFilter();
                        setOpenPeriod(false);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={categoryMenuRef} className={FINANCE_FILTER_MENU_TRIGGER_WRAP}>
              <button
                type="button"
                onMouseDown={(ev) => ev.stopPropagation()}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setOpenCategoryMenu((v) => !v);
                  setOpenStatusMenu(false);
                  setOpenPeriod(false);
                }}
                className={adminFilterMenuTriggerClass(openCategoryMenu)}
                aria-label="Category"
                aria-haspopup="menu"
                aria-expanded={openCategoryMenu}
              >
                <span className="truncate">{categoryLabel}</span>
                <ChevronDown
                  className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-transform duration-150 ${
                    openCategoryMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openCategoryMenu && (
                <div
                  onClick={(ev) => ev.stopPropagation()}
                  className="absolute left-0 right-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpenCategoryMenu(false);
                      setCategoryFilter("all");
                      resetPageOnFilter();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                  >
                    <span>All Categories</span>
                    {categoryFilter === "all" && <Check className="w-4 h-4 text-slate-700" />}
                  </button>
                  {categoryOptions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setOpenCategoryMenu(false);
                        setCategoryFilter(c.id);
                        resetPageOnFilter();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span className="truncate">{c.name}</span>
                      {categoryFilter === c.id && <Check className="w-4 h-4 shrink-0 text-slate-700" />}
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
                  setOpenCategoryMenu(false);
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
                        resetPageOnFilter();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span>{opt.label}</span>
                      {statusFilter === opt.id && <Check className="w-4 h-4 text-slate-700" />}
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
            <div className="py-12 text-center text-[13px] text-slate-500">Loading rules…</div>
          ) : (
            <table className="min-w-full text-[12px] leading-4">
              <thead>
                <tr className="bg-[#f9fbfc] text-left border-y border-slate-200">
                  <th className="py-2 pr-4 pl-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    ID
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Rule Name
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Category
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Commission (%)
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Status
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Period
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Created Date
                  </th>
                  <th className="py-2 pr-4 text-xs leading-4 font-semibold text-[oklch(0.21_0.034_264.665)]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr
                    key={r.IsGlobal ? `global:${r.CommissionDefaultID}` : r.CommissionDefaultID}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-2 pr-4 pl-4 font-mono text-[11px] text-slate-600">
                      {r.CommissionDefaultID}
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => router.push(commissionRuleEditHref(r))}
                        className="text-[12px] font-medium text-[#2563FF] hover:underline underline-offset-2 text-left"
                      >
                        {displayRuleName(r)}
                      </button>
                    </td>
                    <td className="py-2 pr-4 text-slate-700 font-medium">{r.CategoryName}</td>
                    <td className="py-2 pr-4 text-slate-700">{r.CommissionPercent}%</td>
                    <td className="py-2 pr-4">
                      <StatusPill
                        status={
                          r.ExpiredAt
                            ? "Expired"
                            : r.ActivatedAt
                              ? r.IsActive
                                ? "Active"
                                : "Inactive"
                              : "Pending"
                        }
                      />
                    </td>
                    <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">
                      {r.EffectiveFrom}
                      {r.EffectiveTo ? ` to ${r.EffectiveTo}` : ""}
                    </td>
                    <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">
                      {r.CreatedAt ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3 pt-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(commissionRuleEditHref(r))}
                          className="text-[12px] font-medium text-[#2563FF] hover:underline underline-offset-2"
                        >
                          Edit
                        </button>
                        {!r.ExpiredAt ? (
                          <button
                            type="button"
                            disabled={toggleBusyId === r.CommissionDefaultID}
                            onClick={() => void onToggleActive(r)}
                            className={`text-[12px] font-medium hover:underline underline-offset-2 disabled:opacity-50 ${
                              r.IsActive ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            {toggleBusyId === r.CommissionDefaultID
                              ? "…"
                              : r.IsActive
                                ? "Deactivate"
                                : "Activate"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No rules
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
              <span className="font-medium text-slate-800">platform global</span> rules will be set to{" "}
              <span className="font-medium text-slate-800">Inactive</span>.
            </p>
          ) : (
            <p>
              If you activate this rule, all other rules in the same category will be set to{" "}
              <span className="font-medium text-slate-800">Inactive</span>.
            </p>
          )
        }
        confirmLabel="Activate"
        confirmTone="primary"
        confirmLoading={
          !!activateConfirmRow && toggleBusyId === activateConfirmRow.CommissionDefaultID
        }
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
