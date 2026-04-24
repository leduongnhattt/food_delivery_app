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
import type { AdminCommissionFeeCategoryRuleItem } from "@/types/admin-api.types";
import { useToast } from "@/contexts/toast-context";
import {
  fetchFoodCategoriesList,
  getCommissionFeesGlobal,
  listCommissionFeeCategoryRules,
  updateCommissionFeeCategoryRule,
} from "@/services/admin.service";

type RuleStatus = "Pending" | "Active" | "Inactive";

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

function StatusPill({ status }: { status: RuleStatus }) {
  const cls =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "Pending"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex rounded px-2 py-1 text-[11px] leading-4 border ${cls}`}>
      {status}
    </span>
  );
}

function displayRuleName(row: AdminCommissionFeeCategoryRuleItem): string {
  const n = row.RuleName?.trim();
  if (n) return n;
  return `${row.CategoryName} Commission Default`;
}

export function CommissionFeesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [status, setStatus] = useState<"all" | RuleStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
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
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(q.trim()), 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetchFoodCategoriesList();
      setCategoryOptions(
        res.categories.map((c) => ({ id: c.id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch {
      setCategoryOptions([]);
    }
  }, []);

  const loadGlobal = useCallback(async () => {
    setGlobalLoading(true);
    try {
      const g = await getCommissionFeesGlobal();
      setGlobalRow({
        DefaultID: g.DefaultID,
        CommissionPercent: g.CommissionPercent,
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
    try {
      const isActiveParam = undefined;
      const res = await listCommissionFeeCategoryRules({
        page,
        pageSize,
        search: debouncedSearch || undefined,
        foodCategoryId: categoryFilter === "all" ? undefined : categoryFilter,
        status: status === "all" ? undefined : status,
        isActive: isActiveParam,
        effectiveFrom: from.trim() || undefined,
        effectiveTo: to.trim() || undefined,
      });
      setRows(res.items);
      setTotal(res.total);
    } catch (e) {
      setRows([]);
      setTotal(0);
      // Intentionally keep the UI clean (no error banner per design).
    } finally {
      setListLoading(false);
    }
  }, [page, pageSize, debouncedSearch, categoryFilter, status, from, to]);

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

  const statusLabel = status === "all" ? "All Status" : status;
  const periodLabel =
    from && to ? `${from} to ${to}` : from ? `${from} onwards` : to ? `Until ${to}` : "Period";

  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function onToggleActive(row: AdminCommissionFeeCategoryRuleItem) {
    const id = row.CommissionDefaultID;
    setToggleBusyId(id);
    try {
      const next = !row.IsActive;
      const [res] = await Promise.all([
        updateCommissionFeeCategoryRule(id, { isActive: next }),
        new Promise<void>((r) => window.setTimeout(r, 450)),
      ]);
      setRows((prev) => {
        const nextRows = prev.map((x) => (x.CommissionDefaultID === id ? res.item : x));
        if (status === "all") return nextRows;
        const nextStatus =
          res.item.ActivatedAt ? (res.item.IsActive ? "Active" : "Inactive") : "Pending";
        if (status === nextStatus) return nextRows;
        return nextRows.filter((x) => x.CommissionDefaultID !== id);
      });
      showToast(next ? "Rule activated." : "Rule deactivated.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setToggleBusyId(null);
    }
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
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
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
                        value={from}
                        onChange={(next) => {
                          setFrom(next);
                          resetPageOnFilter();
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
                          resetPageOnFilter();
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
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setOpenStatusMenu(false);
                        setStatus(opt.id);
                        resetPageOnFilter();
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
                  <tr key={r.CommissionDefaultID} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 pr-4 pl-4 font-mono text-[11px] text-slate-600">
                      {r.CommissionDefaultID}
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/admin/finance/commission-fees/${encodeURIComponent(r.CommissionDefaultID)}/edit`,
                          )
                        }
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
                          r.ActivatedAt
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
                          onClick={() =>
                            router.push(
                              `/admin/finance/commission-fees/${encodeURIComponent(r.CommissionDefaultID)}/edit`,
                            )
                          }
                          className="text-[12px] font-medium text-[#2563FF] hover:underline underline-offset-2"
                        >
                          Edit
                        </button>
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
    </div>
  );
}
