"use client";

import { useMemo, useState } from "react";
import { mergeClasses, formatDate } from "@/lib/utils";

type HistoryKind = "all" | "order" | "logistic";

export type AdminOrderHistoryRow = {
  id: string;
  kind: HistoryKind;
  /** ISO string */
  at: string;
  statusLabel: string;
  operatorLabel: string;
  remark: string;
};

function badgeClass(status: string) {
  const s = String(status || "").toLowerCase();
  if (s.includes("paid") || s.includes("success")) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (s.includes("ready")) return "bg-sky-50 text-sky-700 ring-sky-200";
  if (s.includes("created")) return "bg-slate-50 text-slate-700 ring-slate-200";
  if (s.includes("failed") || s.includes("cancel")) return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-50 text-slate-700 ring-slate-200";
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className={mergeClasses(
        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        badgeClass(label),
      )}
    >
      {label}
    </span>
  );
}

export function AdminOrderHistoryCard({
  title = "Order and Logistic History",
  rows,
}: {
  title?: string;
  rows: AdminOrderHistoryRow[];
}) {
  const [tab, setTab] = useState<HistoryKind>("all");
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    return rows.filter((r) => r.kind === tab);
  }, [rows, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="px-4 py-3">
        <div className="text-[12px] font-semibold text-slate-700">{title}</div>
      </div>

      <div className="border-b border-slate-100 px-4">
        <div className="flex items-center gap-6">
          {[
            { id: "all" as const, label: "All" },
            { id: "order" as const, label: "Order" },
            { id: "logistic" as const, label: "Logistic" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  setPage(1);
                }}
                className={mergeClasses(
                  "relative -mb-px py-2 text-[12px] font-medium transition-colors",
                  active ? "text-[#2563FF]" : "text-slate-500 hover:text-slate-700",
                )}
              >
                {t.label}
                {active ? <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#2563FF]" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-[12px] leading-4">
          <thead>
            <tr className="bg-[#f9fbfc] text-left border-b border-slate-200">
              <th className="py-2 pr-4 pl-4 text-xs font-semibold text-slate-600">Update Time</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Status</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Operator</th>
              <th className="py-2 pr-4 text-xs font-semibold text-slate-600">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50">
                <td className="py-2 pr-4 pl-4 text-slate-700">
                  <div>{formatDate(r.at)}</div>
                </td>
                <td className="py-2 pr-4">
                  <StatusBadge label={r.statusLabel} />
                </td>
                <td className="py-2 pr-4 text-slate-700">{r.operatorLabel}</td>
                <td className="py-2 pr-4 text-slate-700">{r.remark}</td>
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-500">
                  No history
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-slate-100">
        <div className="text-[11px] text-slate-500">
          {safePage} / {totalPages}
        </div>
        <select
          value={String(pageSize)}
          onChange={(e) => {
            const v = Number(e.target.value) as 10 | 20 | 50;
            setPageSize(v);
            setPage(1);
          }}
          className="h-7 rounded border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
          aria-label="Rows per page"
        >
          <option value="10">10 / page</option>
          <option value="20">20 / page</option>
          <option value="50">50 / page</option>
        </select>
      </div>
    </div>
  );
}

