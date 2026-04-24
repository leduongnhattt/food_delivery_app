"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type FeeStatus = "Active" | "Inactive";
type PaymentChannel =
  | "Credit Card"
  | "Stripe"
  | "MoMo"
  | "VNPay"
  | "Cash"
  | "Bank Transfer";

type TransactionFeeRule = {
  id: string;
  name: string;
  paymentChannel: PaymentChannel;
  ratePct: number;
  period: string;
  status: FeeStatus;
  createdDate: string;
};

type TransactionFeeGlobalDefault = {
  ruleId: string;
  ratePct: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
};

// UI-only mock: keep placeholder values to match CMS header design.
const MOCK_GLOBAL_FEE: TransactionFeeGlobalDefault | null = {
  ruleId: "00000000-0000-0000-0000-000000000002",
  ratePct: 2.5,
  effectiveFrom: "2026-03-20",
  effectiveTo: undefined,
  isActive: true,
};

const MOCK_FEES: TransactionFeeRule[] = [
  {
    id: "01KMCW2BFBH0Y0C7F488WS83NN",
    name: "Test Fee 2",
    paymentChannel: "Credit Card",
    ratePct: 2,
    period: "2026-03-23 to 2026-03-25",
    status: "Inactive",
    createdDate: "2026-03-23",
  },
  {
    id: "01KSTRIPE000000000000000001",
    name: "Stripe Card Fee",
    paymentChannel: "Stripe",
    ratePct: 2.9,
    period: "2026-03-20 to Present",
    status: "Active",
    createdDate: "2026-03-20",
  },
  {
    id: "01KMS1Z3AAM2ZEDH2CRAKNWHHF",
    name: "New Fee Test",
    paymentChannel: "Cash",
    ratePct: 7,
    period: "2026-03-29 to 2026-04-01",
    status: "Active",
    createdDate: "2026-03-29",
  },
  {
    id: "01KMS12P9J5G3F2P6E94H9B855",
    name: "mm",
    paymentChannel: "MoMo",
    ratePct: 6,
    period: "2026-03-20 to Present",
    status: "Active",
    createdDate: "2026-03-20",
  },
  {
    id: "01KMS00SQ8Y8N4NEXA8PF1CJW5",
    name: "Credit Card Premium Fee",
    paymentChannel: "Credit Card",
    ratePct: 2.5,
    period: "2026-03-20 to 2026-03-28",
    status: "Inactive",
    createdDate: "2026-03-20",
  },
  {
    id: "01KMMFBY6Z6M7BK0CNRTSYWXY",
    name: "GCash Promo Fee",
    paymentChannel: "VNPay",
    ratePct: 2,
    period: "2026-03-20 to 2026-03-27",
    status: "Inactive",
    createdDate: "2026-03-20",
  },
];

const PAGE_SIZE_OPTIONS = [12, 24, 48] as const;

function StatusPill({ status }: { status: FeeStatus }) {
  const cls =
    status === "Active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`inline-flex rounded px-2 py-1 text-[11px] leading-4 border ${cls}`}>{status}</span>;
}

export function TransactionFeesPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState<"all" | PaymentChannel>("all");
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

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return MOCK_FEES.filter((r) => {
      const okQ = !qq || r.name.toLowerCase().includes(qq);
      const okChannel = channel === "all" || r.paymentChannel === channel;
      const okStatus = status === "all" || r.status === status;
      const okFrom = !from || r.createdDate >= from;
      const okTo = !to || r.createdDate <= to;
      return okQ && okChannel && okStatus && okFrom && okTo;
    });
  }, [q, channel, status, from, to]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(total, startIdx + pageSize);
  const rows = filtered.slice(startIdx, endIdx);

  const channelLabel = channel === "all" ? "All Payment Channels" : channel;
  const statusLabel = status === "all" ? "All Status" : status;
  const periodLabel =
    from && to ? `${from} to ${to}` : from ? `${from} onwards` : to ? `Until ${to}` : "Period";

  function resetPage() {
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <FinanceListPageHeader
        title="Transaction Fees"
        description="Manage transaction fee rules based on payment channels."
      />

      <FinanceGlobalDefaultCard
        ruleId={MOCK_GLOBAL_FEE?.ruleId}
        rateLabel="Transaction Fee Rule"
        ratePct={MOCK_GLOBAL_FEE?.ratePct}
        effectiveFrom={MOCK_GLOBAL_FEE?.effectiveFrom}
        actionLabel="Edit Global Fee"
        onAction={() => router.push("/admin/finance/transaction-fees/new?scope=global")}
      />

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
                  {(
                    [
                      { id: "all" as const, label: "All Payment Channels" },
                      { id: "Credit Card" as const, label: "Credit Card" },
                      { id: "Stripe" as const, label: "Stripe" },
                      { id: "MoMo" as const, label: "MoMo" },
                      { id: "VNPay" as const, label: "VNPay" },
                      { id: "Cash" as const, label: "Cash" },
                      { id: "Bank Transfer" as const, label: "Bank Transfer" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setOpenChannelMenu(false);
                        setChannel(opt.id as any);
                        resetPage();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-[13px] md:text-[13px] text-slate-900 hover:bg-slate-50"
                    >
                      <span className="truncate">{opt.label}</span>
                      {channel === opt.id && <Check className="w-4 h-4 shrink-0 text-slate-700" />}
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
                        setStatus(opt.id as any);
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
              setPageSize(n as any);
              setPage(1);
            }}
          />
        }
      >
        <div className="mt-2 overflow-x-auto">
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
                  r.status === "Active"
                    ? { label: "Deactivate", cls: "text-rose-600" }
                    : { label: "Activate", cls: "text-emerald-700" };
                return (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 pr-4 pl-4 font-mono text-[11px] text-slate-600">
                      {r.id.slice(0, 18)}
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        className="text-[12px] font-medium text-[#2563FF] hover:underline underline-offset-2 text-left"
                      >
                        {r.name}
                      </button>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{r.paymentChannel}</td>
                    <td className="py-2 pr-4 text-slate-700">{r.ratePct.toFixed(2)}%</td>
                    <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">{r.period}</td>
                    <td className="py-2 pr-4">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">{r.createdDate}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="text-[12px] font-medium text-[#2563FF] hover:underline underline-offset-2"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`text-[12px] font-medium hover:underline underline-offset-2 ${primaryAction.cls}`}
                        >
                          {primaryAction.label}
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
        </div>
      </FinanceRulesListCardShell>
    </div>
  );
}

