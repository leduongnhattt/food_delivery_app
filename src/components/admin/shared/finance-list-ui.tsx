"use client";

import type React from "react";
import { Info, Plus } from "lucide-react";

export function FinanceListPageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-[14px] leading-[18px] font-medium text-[oklch(0.21_0.034_264.665)]">
          {title}
        </h1>
        <Info className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </div>
      <p className="mt-1 text-[13px] leading-[18px] font-medium text-[oklch(0.551_0.027_264.364)]">
        {description}
      </p>
    </div>
  );
}

export function FinanceGlobalDefaultCard({
  ruleId,
  rateLabel,
  ratePct,
  effectiveFrom,
  actionLabel,
  onAction,
  actionDisabled,
}: {
  ruleId?: string | null;
  rateLabel: string;
  ratePct?: number | null;
  effectiveFrom?: string | null;
  actionLabel: string;
  onAction: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-2 bg-[#f9fbfc]">
        <div className="grid w-full grid-cols-1 sm:grid-cols-3">
          <div className="py-2 pr-4">
            <div className="text-[11px] font-bold tracking-wide text-slate-500">Rule ID</div>
            <div className="mt-1 text-[13px] font-medium text-slate-700">#{ruleId ?? "—"}</div>
          </div>
          <div className="py-2 px-4 border-l border-slate-200">
            <div className="text-[11px] font-bold tracking-wide text-slate-500">{rateLabel}</div>
            <div className="mt-1 text-[13px] font-semibold text-[#2563FF]">
              {ratePct ?? 0}%
            </div>
          </div>
          <div className="py-2 px-4 border-l border-slate-200">
            <div className="text-[11px] font-bold tracking-wide text-slate-500">Effective Date</div>
            <div className="mt-1 text-[13px] font-medium text-slate-700">{effectiveFrom ?? "—"}</div>
          </div>
        </div>

        <button
          type="button"
          disabled={actionDisabled}
          className="shrink-0 inline-flex h-8 min-h-8 items-center rounded-md border border-[#93C5FD] bg-white px-4 text-[12px] font-medium text-[#2563FF] hover:bg-[#EFF6FF] transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

export function FinanceRulesListCardShell({
  filters,
  title,
  createLabel,
  onCreate,
  children,
  pagination,
}: {
  filters: React.ReactNode;
  title: string;
  createLabel: string;
  onCreate: () => void;
  children: React.ReactNode;
  pagination: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="px-4 pt-3">{filters}</div>

      <div className="mt-3 flex items-end justify-between px-4">
        <div className="text-[14px] font-bold text-slate-800 pb-[1px]">{title}</div>
        <button
          type="button"
          className="inline-flex h-8 min-h-8 items-center gap-2 rounded border border-[#2563FF] bg-[#2563FF] px-3 text-[12px] font-medium text-white hover:bg-[#1E4FE6] transition-colors"
          onClick={onCreate}
        >
          <Plus className="h-4 w-4" />
          {createLabel}
        </button>
      </div>

      {children}
      {pagination}
    </div>
  );
}

